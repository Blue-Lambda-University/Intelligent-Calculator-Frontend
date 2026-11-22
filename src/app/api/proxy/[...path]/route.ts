import { NextRequest, NextResponse } from 'next/server';
// Read at request time so `docker run -e API_INTERNAL_URL=...` is not baked in at build.
const runtimeEnv = process.env;
const backend = runtimeEnv.API_INTERNAL_URL || 'http://localhost:8000';
async function proxy(req: NextRequest, context: { params: Promise<{path: string[]}> }) {
  const {path} = await context.params;
  // Only permit the public API routes used by this application.
  const permitted = ['api/v1/calculate','api/v1/scientific','api/v1/ai/calculate','api/v1/history','api/v1/version','health/live','health/ready'];
  const pathValue = path.join('/');
  if (!permitted.includes(pathValue) && !/^api\/v1\/history\/[a-f0-9-]{36}$/.test(pathValue)) {
    return NextResponse.json({detail:'Unknown API route'},{status:404});
  }
  const target = new URL(pathValue,backend.endsWith('/')?backend:backend+'/');
  const sid = req.cookies.get('calculator_sid')?.value || crypto.randomUUID();
  const headers = { 'Content-Type':'application/json', 'X-Session-ID':sid };
  try {
    const upstream = await fetch(target,{method:req.method,headers,body:['POST','PUT','PATCH'].includes(req.method)?await req.text():undefined,cache:'no-store',signal:AbortSignal.timeout(12000)});
    const body=await upstream.text();
    const response = new NextResponse(body,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('content-type')||'application/json'}});
    if (!req.cookies.has('calculator_sid')) response.cookies.set('calculator_sid',sid,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*7});
    return response;
  } catch {
    return NextResponse.json({detail:'Backend is currently unavailable'},{status:503});
  }
}
export {proxy as GET,proxy as POST,proxy as DELETE};
