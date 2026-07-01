const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importStatement = `import {
  MapPin,
  Menu,
  X,
  Search,
  PlusCircle,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  MoreVertical,
  ChevronRight,
  Hand,
  CheckCircle,
  Shield,
  FileSearch,
  MessageSquareHeart,
  Handshake,
  Quote,
  Upload,
  ArrowLeft,
  XCircle,
  Trash2,
  Edit2
} from "lucide-react";`;

const newImportStatement = `import {
  MapPin,
  Menu,
  X,
  Search,
  PlusCircle,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  MoreVertical,
  ChevronRight,
  Hand,
  CheckCircle,
  Shield,
  FileSearch,
  MessageSquareHeart,
  Handshake,
  Quote,
  Upload,
  ArrowLeft,
  XCircle,
  Trash2,
  Edit2,
  Mail
} from "lucide-react";`;

code = code.replace(importStatement, newImportStatement);
fs.writeFileSync('src/App.tsx', code);
console.log('Added Mail to imports');
