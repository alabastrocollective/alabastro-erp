import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  DollarSign,
  FolderKanban,
  Home,
  Power,
  Settings,
  Target,
  UserRound,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "~/components/ui/sidebar";
import { logout } from "~/services/authService";
import { useAuthStore } from "~/store/authStore";
import { useNavigate, useLocation, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "./button";
import { cn } from "~/lib/utils";
import { PersonAvatar } from "~/components/PersonAvatar";
import { getAccentColor, getLogoLightPath, getPrimaryColor, getShortName } from "~/lib/erpBranding";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
  children?: { title: string; url: string }[];
};

const items: NavItem[] = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Finanzas", url: "/finanzas", icon: DollarSign },
  {
    title: "Proyectos",
    url: "/proyectos",
    icon: FolderKanban,
    children: [
      { title: "Listado", url: "/proyectos" },
      { title: "Tareas", url: "/proyectos/tareas" },
    ],
  },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Personal", url: "/personal", icon: UserRound },
  { title: "Objetivos", url: "/objetivos", icon: Target },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

function getOpenSectionForPath(pathname: string, visibleItems: NavItem[]): string | null {
  const match = visibleItems.find(
    (item) =>
      item.children && item.children.length > 0 &&
      (item.url === "/" ? pathname === "/" : pathname === item.url || pathname.startsWith(item.url + "/"))
  );
  return match?.title ?? null;
}

export function AppSidebar() {
  const { logout: logoutUser, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const visibleItems = useMemo(() => items, []);

  const closeMobileMenu = () => { if (isMobile) setOpenMobile(false); };
  const [openSection, setOpenSection] = useState<string | null>(() =>
    getOpenSectionForPath(location.pathname, visibleItems)
  );

  useEffect(() => {
    const key = getOpenSectionForPath(location.pathname, visibleItems);
    if (key) setOpenSection(key);
  }, [location.pathname, visibleItems]);

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    if (url === "/proyectos") return location.pathname === "/proyectos";
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (item.url === "/") return location.pathname === "/";
    return location.pathname === item.url || location.pathname.startsWith(item.url + "/");
  };

  const handleLogout = async () => {
    closeMobileMenu();
    try { await logout(); } catch {} finally {
      logoutUser();
      toast.success("Sesión cerrada");
      navigate("/login");
    }
  };

  const accent = getAccentColor();
  const primary = getPrimaryColor();

  return (
    <Sidebar style={{ background: primary }}>
      <SidebarContent className="bg-primary-blue text-white">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="p-8 flex justify-center">
              <img src={getLogoLightPath()} alt={getShortName()} className="w-2/3 rounded-2xl" />
            </div>
          </SidebarGroupContent>

          {user && (
            <SidebarGroupContent className="px-4 pb-4">
              <div className="bg-accent-blue rounded-full flex items-center gap-3 p-3">
                <PersonAvatar
                  name={user?.user_metadata?.full_name || user?.email || "Usuario"}
                  avatarColor={(user?.user_metadata as { avatar_color?: string })?.avatar_color}
                  avatarUrl={(user?.user_metadata as { avatar_url?: string })?.avatar_url}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary-blue font-bold truncate">
                    {user?.user_metadata?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-200 truncate">{user?.email}</p>
                </div>
              </div>
            </SidebarGroupContent>
          )}

          <SidebarGroupContent className="px-4">
            <SidebarMenu>
              {visibleItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openSection === item.title;

                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton className="text-base hover:bg-transparent hover:text-accent-blue cursor-pointer" size="lg" asChild>
                        <Link to={item.url} onClick={closeMobileMenu}>
                          <item.icon color={isActive(item.url) ? accent : "white"} />
                          <span className={cn(isActive(item.url) ? "text-accent-blue" : "")}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <Collapsible open={isOpen} onOpenChange={(open) => setOpenSection(open ? item.title : null)}>
                      <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none hover:bg-white/10">
                        <Link to={item.url} onClick={closeMobileMenu} className={cn("flex min-w-0 flex-1 items-center gap-2 text-base hover:text-accent-blue cursor-pointer", isParentActive(item) && "text-accent-blue")}>
                          <item.icon color={isParentActive(item) ? accent : "white"} className="size-5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                        <CollapsibleTrigger asChild>
                          <button type="button" className="shrink-0 rounded p-1 text-white/80 outline-none hover:bg-white/10 hover:text-accent-blue">
                            <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children!.map((sub) => (
                            <SidebarMenuSubItem key={sub.url}>
                              <SidebarMenuSubButton asChild isActive={isActive(sub.url)} className={isActive(sub.url) ? "text-accent-blue bg-white/10" : "text-white/90 hover:text-accent-blue"}>
                                <Link to={sub.url} onClick={closeMobileMenu}>{sub.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-primary-blue p-6">
        <Button onClick={handleLogout} className="bg-accent-blue hover:bg-accent-blue/80 cursor-pointer">
          <Power /> Cerrar Sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
