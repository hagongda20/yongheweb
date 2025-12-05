import axios from "axios";

const BASE_URL = "http://localhost:9527/api";

export const sayHello = async () => {
  const res = await axios.get(`${BASE_URL}/hello`);
  return res.data;
};
