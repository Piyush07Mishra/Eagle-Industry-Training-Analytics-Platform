import re

with open('src/components/AppLayout.tsx', 'r') as f:
    text = f.read()

admin_block_target = """    } else if (user?.role === "ADMIN") {
      return [
         { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
         { label: "User Management", icon: BookOpen, path: "/admin/training" },
      ]
    }"""
    
admin_block_new = """    } else if (user?.role === "ADMIN") {
      return [
         { label: "Overview", icon: LayoutDashboard, path: "/admin/dashboard" },
         { label: "User Management", icon: BookOpen, path: "/admin/training" },
         { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
         { label: "Feedback", icon: MessageSquare, path: "/admin/feedback" },
      ]
    }"""

text = text.replace(admin_block_target, admin_block_new)

# Add BarChart3 to luicde-react imports if not there
if 'BarChart3' not in text:
    lucide_import = re.search(r'import {([^}]+)} from "lucide-react";', text)
    if lucide_import:
        old_imports = lucide_import.group(1)
        new_imports = old_imports + ", BarChart3"
        text = text.replace(f'import {{{old_imports}}} from "lucide-react";', f'import {{{new_imports}}} from "lucide-react";')

with open('src/components/AppLayout.tsx', 'w') as f:
    f.write(text)
