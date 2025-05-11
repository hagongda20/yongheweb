import request from '../utils/request';

export async function login(username: string, password: string) {
  console.log("-----------登录功能执行-----------");
  const res = await request.post('/api/users/', { username, password });
  console.log("登录后台返回：",res);
  return res.data; // 返回后端返回的 token
}