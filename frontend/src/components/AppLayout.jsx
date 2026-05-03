import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  FileTextOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: '/resume', icon: <FileTextOutlined />, label: 'Resume' },
  { key: '/board', icon: <AppstoreOutlined />, label: 'Applications' },
  { key: '/analysis', icon: <LineChartOutlined />, label: 'Analysis' },
];

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider breakpoint="lg" collapsedWidth="0" theme="light">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: token.colorPrimary,
          }}
        >
          JobPilot
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navItems}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>

      <Layout>
        {/* Top header with user dropdown */}
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
              ],
            }}
          >
            <Button type="text" icon={<Avatar size="small" icon={<UserOutlined />} />}>
              {user?.email}
            </Button>
          </Dropdown>
        </Header>

        {/* Main content area — child routes render here via <Outlet /> */}
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};