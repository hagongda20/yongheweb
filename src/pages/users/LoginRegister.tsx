import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Tabs,
  Select,
  App,
} from "antd";
import { useNavigate } from "react-router-dom";
import request from "../../utils/request";
import { setToken } from "../../utils/auth";

const { TabPane } = Tabs;
const { Option } = Select;

const LoginRegister: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [activeKey, setActiveKey] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  /* 加载公司列表 */
  useEffect(() => {
    request
      .get("/api/company/list")
      .then((res) => {
        if (res.data?.success) {
          setCompanies(res.data.data || []);
        } else {
          message.error("公司列表加载失败");
        }
      })
      .catch(() => {
        message.error("公司列表加载失败");
      });
  }, []);

  /*  登录 */
  const handleLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await request.post("/api/users/", values);
      const { token, user } = res.data;

      setToken(token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(user.roles || []));

      message.success({
        content: "登录成功",
        style: { marginTop: "35vh" },
      });

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
    setLoading(true);
    try {
      await request.post("/api/users/register", {
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        phone: values.phone,
        remark: values.remark,
        company_id: values.company_id,
      });

      message.success({
        content: "注册成功，等待审核",
        style: {
          marginTop: "35vh",
          fontSize: 16,
        },
      });

      // 延迟切回登录页，保证提示能看到
      setTimeout(() => {
        setActiveKey("login");
      }, 800);
    } catch (err: any) {
      message.error(err.response?.data?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "120px auto" }}>
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as "login" | "register")}
        centered
      >
        {/* ================= 登录 ================= */}
        <TabPane tab="登录" key="login">
          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
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
              label="所属公司"
              name="company_id"
              rules={[{ required: true, message: "请选择公司" }]}
            >
              <Select placeholder="请选择公司">
                {companies.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
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
              dependencies={["password"]}
              rules={[
                { required: true, message: "请确认密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("两次密码不一致")
                    );
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item label="备注" name="remark">
              <Input.TextArea rows={2} />
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
