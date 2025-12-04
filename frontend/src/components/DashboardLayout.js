import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Home, Mail, MailOpen, Building2, Users, UserCog, LogOut, Settings } from "lucide-react";

const DashboardLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const menuItems = [
    { path: "/", label: "Tableau de bord", icon: Home, exact: true },
    { path: "/messages/entrant", label: "Message entrant", icon: Mail },
    { path: "/messages/sortant", label: "Message sortant", icon: MailOpen },
    { path: "/services", label: "Services", icon: Building2 },
    { path: "/correspondents", label: "Correspondants", icon: Users },
  ];

  if (user?.role === "admin") {
    menuItems.push({ path: "/users", label: "Utilisateurs", icon: UserCog });
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Message</h1>
              <p className="text-xs text-slate-500">Multi-services</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact 
                ? location.pathname === item.path
                : isActive(item.path);
              
              return (
                <Button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  variant={active ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    active
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2" data-testid="user-menu-button">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} data-testid="logout-button">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-8">
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default DashboardLayout;
