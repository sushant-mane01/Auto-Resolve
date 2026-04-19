import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/store/auth";

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full glass surface-hover px-2 py-1.5 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-cyan text-[11px] font-semibold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden md:inline text-foreground/90">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          {user.role === "admin" ? <ShieldCheck className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-primary" />}
          <div className="flex flex-col">
            <span className="text-sm">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" && (
          <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Admin console
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate("/")}>
          <UserIcon className="mr-2 h-4 w-4" /> Chat workspace
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-rose-400 focus:text-rose-400"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
