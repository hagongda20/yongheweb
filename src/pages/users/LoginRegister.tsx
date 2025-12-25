import React, { useState } from "react";
import { Form, Input, Button, message, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setToken } from "../../utils/auth";

const { TabPane } = Tabs;

const LoginRegister: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ======================
     登录
  ====================== */
  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/users/", values);

      const { token, user } = res.data;

      // 1️⃣ 存 token（接口鉴权用）
      setToken(token);

      // 2️⃣ 存用户信息（前端展示用）
      localStorage.setItem("user", JSON.stringify(user));

      // 3️⃣ 存角色（权限判断用）
      localStorage.setItem("roles", JSON.stringify(user.roles || []));

      message.success("登录成功");
      navigate("/");
    } catch (err: any) {
      message.error(err.response?.data?.msg || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     注册
  ====================== */
  const handleRegister = async (values: any) => {
    if (values.password !== values.confirm_password) {
      message.error("两次密码不一致");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/register", {
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        phone: values.phone,
        remark: values.remark,
      });

      message.success("注册成功，请等待管理员审核");
    } catch (err: any) {
      message.error(err.response?.data?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "120px auto" }}>
      <Tabs defaultActiveKey="login" centered>
        {/* ================= 登录 ================= */}
        <TabPane tab="登录" key="login">
          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form>
        </TabPane>

        {/* ================= 注册 ================= */}
        <TabPane tab="注册" key="register">
          <Form layout="vertical" onFinish={handleRegister}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="真实姓名"
              name="real_name"
              rules={[{ required: true, message: "请输入真实姓名" }]}
            >
              <Input placeholder="用于审核和记录" />
            </Form.Item>

            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { required: true, message: "请输入手机号" },
                { pattern: /^1\d{10}$/, message: "手机号格式不正确" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirm_password"
              rules={[{ required: true, message: "请确认密码" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item label="备注" name="remark">
              <Input.TextArea
                rows={2}
                placeholder="可选，如部门、用途说明等"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              提交注册申请
            </Button>
          </Form>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LoginRegister;
