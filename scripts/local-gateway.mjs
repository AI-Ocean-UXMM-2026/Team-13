// Local integration only: supplies the standard Supabase REST URL prefix.
import http from 'node:http';
http.createServer((req,res)=>{
 if(!req.url.startsWith('/rest/v1/')){res.writeHead(404);res.end();return}
 const upstream=http.request({hostname:'127.0.0.1',port:54322,path:req.url.slice('/rest/v1'.length),method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});
 upstream.on('error',()=>{res.writeHead(502);res.end()});req.pipe(upstream);
}).listen(54321,'127.0.0.1',()=>console.log('Local Supabase REST gateway listening on port 54321'));
