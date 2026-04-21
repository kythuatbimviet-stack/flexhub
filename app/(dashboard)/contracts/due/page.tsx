"use client";

import * as React from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Search,
    Clock,
    BadgeCheck,
    Package,
    Building2,
    CalendarClock,
    FileText,
    ArrowLeft,
    User,
    Edit2,
    Trash2,
    Trash,
    CreditCard,
    ClipboardCheck,
    RefreshCw,
    PauseCircle,
    XCircle,
    AlertCircle,
    Filter,
    RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    fetchContractsLite,
    bulkDeleteContracts,
} from "@/app/actions/contracts";
import Link from "next/link";
import { ContractDetailsSheet } from "@/components/contracts/contract-details-sheet";
import { ContractClosureDialog } from "@/components/contracts/contract-closure-dialog";
import { fetchBranches } from "@/app/actions/branches";
import { fetchContractConfigs } from "@/app/actions/config-params";
import { usePermissions } from "@/hooks/use-permissions";
import {
    startOfWeek,
    endOfWeek,
    subWeeks,
    addWeeks,
    startOfMonth,
    endOfMonth,
    subMonths,
    addMonths,
    startOfQuarter,
    endOfQuarter,
    isWithinInterval,
} from "date-fns";

// ─── Closure Status Badge ────────────────────────────────────
function ClosureStatusBadge({ status }: { status?: string }) {
    if (!status) {
        return (
            <span className="text-[10px] text-gray-400 italic font-medium">
                Chưa xử lý
            </span>
        );
    }
    const map: Record<
        string,
        { label: string; icon: React.ElementType; cls: string }
    > = {
        Renew: {
            label: "Gia hạn",
            icon: RefreshCw,
            cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400",
        },
        "Tạm nghỉ": {
            label: "Tạm nghỉ",
            icon: PauseCircle,
            cls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400",
        },
        "Nghỉ hẳn": {
            label: "Nghỉ hẳn",
            icon: XCircle,
            cls: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400",
        },
    };
    const cfg = map[status];
    if (!cfg)
        return (
            <Badge variant="outline" className="text-[10px]">
                {status}
            </Badge>
        );
    const Icon = cfg.icon;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                cfg.cls,
            )}
        >
            <Icon className="w-2.5 h-2.5" />
            {cfg.label}
        </span>
    );
}

export default function DueContractsPage() {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [tab, setTab] = React.useState("this-week");
    const [dateRange, setDateRange] = React.useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({ from: undefined, to: undefined });
    const [selectedContract, setSelectedContract] = React.useState<any | null>(
        null,
    );
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);

    // Closure dialog state
    const [closureContract, setClosureContract] = React.useState<any | null>(
        null,
    );
    const [isClosureOpen, setIsClosureOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [branchFilter, setBranchFilter] = React.useState("all");
    const [ptFilter, setPtFilter] = React.useState("all");
    const [showMobileFilters, setShowMobileFilters] = React.useState(false);

    const { permissions, isLoading: isLoadingPermissions } = usePermissions();

    const handleRowClick = (contract: any, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("[data-no-click]")) return;
        setSelectedContract(contract);
        setIsDetailsOpen(true);
    };

    const handleOpenClosure = (contract: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setClosureContract(contract);
        setIsClosureOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa hợp đồng này?")) {
            const result = await bulkDeleteContracts([id]);
            if (!result.success) toast.error("Lỗi khi xóa: " + result.error);
            else {
                toast.success("Đã xóa hợp đồng thành công");
                refetch();
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return;
        if (
            confirm(
                `Bạn có chắc chắn muốn xóa ${selectedRows.length} hợp đồng đã chọn?`,
            )
        ) {
            const result = await bulkDeleteContracts(selectedRows);
            if (!result.success)
                toast.error("Lỗi khi xóa hàng loạt: " + result.error);
            else {
                toast.success(`Đã xóa thành công ${selectedRows.length} hợp đồng`);
                setSelectedRows([]);
                refetch();
            }
        }
    };

    const toggleRow = (id: string) =>
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
        );
    const toggleAll = () =>
        setSelectedRows(
            selectedRows.length === pagedContracts.length && pagedContracts.length > 0
                ? []
                : pagedContracts.map((c: any) => c.id),
        );

    const {
        data: contracts = [],
        isLoading,
        refetch,
    } = useQuery<any[]>({
        queryKey: ["contracts-all"],
        queryFn: async () => {
            const res = await fetchContractsLite(); // ✅ Dùng Lite — cùng queryFn với main contracts page
            return res.success ? (res.data ?? []) : [];
        },
        staleTime: 10 * 60 * 1000, // ✅ Đồng nhất 10 phút với AppDataInitializer & contracts/page.tsx
    });

    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ["branches"],
        queryFn: async () => {
            const res = await fetchBranches();
            return res.success ? (res.data ?? []) : [];
        },
        staleTime: 30 * 60 * 1000,
    });

    const allowedBranches = React.useMemo(() => {
        if (permissions.canViewAllBranches) return branches;
        if (permissions.allowedBranchIds) {
            return branches.filter((b) =>
                permissions.allowedBranchIds?.includes(b.id),
            );
        }
        return [];
    }, [branches, permissions]);

    React.useEffect(() => {
        if (
            !isLoadingPermissions &&
            !permissions.canViewAllBranches &&
            allowedBranches.length === 1 &&
            branchFilter === "all"
        ) {
            setBranchFilter(allowedBranches[0].id);
        }
    }, [allowedBranches, permissions, isLoadingPermissions, branchFilter]);

    // ── Contract Configs ──────────────────────────────────────────
    const { data: configResult } = useQuery({
        queryKey: ["contract-configs"],
        queryFn: fetchContractConfigs,
        staleTime: Infinity,
    });
    const contractStatuses = React.useMemo(
        () => configResult?.data?.statuses || [],
        [configResult],
    );


    const ptOptions = React.useMemo(
        () =>
            Array.from(
                new Set(
                    (contracts ?? []).map((c: any) => c.trainer_name).filter(Boolean),
                ),
            ),
        [contracts],
    );

    const getPeriodRange = React.useCallback(
        (period: string) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            switch (period) {
                case "this-week":
                    return {
                        start: startOfWeek(today, { weekStartsOn: 1 }),
                        end: endOfWeek(today, { weekStartsOn: 1 }),
                    };
                case "last-week":
                    const lastW = subWeeks(today, 1);
                    return {
                        start: startOfWeek(lastW, { weekStartsOn: 1 }),
                        end: endOfWeek(lastW, { weekStartsOn: 1 }),
                    };
                case "next-week":
                    const nextW = addWeeks(today, 1);
                    return {
                        start: startOfWeek(nextW, { weekStartsOn: 1 }),
                        end: endOfWeek(nextW, { weekStartsOn: 1 }),
                    };
                case "this-month":
                    return { start: startOfMonth(today), end: endOfMonth(today) };
                case "last-month":
                    const lastM = subMonths(today, 1);
                    return { start: startOfMonth(lastM), end: endOfMonth(lastM) };
                case "next-month":
                    const nextM = addMonths(today, 1);
                    return { start: startOfMonth(nextM), end: endOfMonth(nextM) };
                case "this-quarter":
                    return { start: startOfQuarter(today), end: endOfQuarter(today) };
                case "expired":
                    return { start: new Date(0), end: new Date(today.getTime() - 1) };
                case "custom":
                    return {
                        start: dateRange.from || new Date(0),
                        end: dateRange.to || new Date(8640000000000000),
                    };
                default:
                    return null;
            }
        },
        [dateRange],
    );

    // ── Filtering Logic ──────────────────────────────────────────
    // Phase 1: Filter by Period, Search, Branch, PT (Global Filters)
    const baseFilteredContracts = React.useMemo(() => {
        const range = getPeriodRange(tab);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return (contracts ?? []).filter((c: any) => {
            if (!c.end_date) return false;
            const endDate = new Date(c.end_date);
            endDate.setHours(0, 0, 0, 0);

            // Pre-filter: Only show contracts that are "due" (expired or expiring in near future)
            const maxRange = getPeriodRange("this-quarter")?.end || addMonths(today, 6);
            if (endDate > maxRange && tab !== "custom") return false;

            // Search filter
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                if (
                    !c.member_name?.toLowerCase().includes(q) &&
                    !c.id?.toLowerCase().includes(q)
                )
                    return false;
            }

            // Branch & PT filters
            if (branchFilter !== "all" && c.branch_id !== branchFilter) return false;
            if (ptFilter !== "all" && c.trainer_name !== ptFilter) return false;

            // Period Tab filter - focus on end_date
            if (range) {
                if (tab === "expired") return endDate < range.end;
                return isWithinInterval(endDate, { start: range.start, end: range.end });
            }

            return true;
        });
    }, [
        contracts,
        tab,
        searchTerm,
        branchFilter,
        ptFilter,
        getPeriodRange,
    ]);

    // Status counts derived from period-filtered data
    const statusCounts = React.useMemo(() => {
        const counts: Record<string, number> = { total: baseFilteredContracts.length };
        contractStatuses.forEach((s: any) => {
            counts[s.nam] = baseFilteredContracts.filter(
                (c: any) => c.status === s.nam,
            ).length;
        });
        return counts;
    }, [baseFilteredContracts, contractStatuses]);

    // Phase 2: Filter by Status for the final table display
    const filteredContracts = React.useMemo(() => {
        if (statusFilter === "all") return baseFilteredContracts;
        return baseFilteredContracts.filter((c: any) => c.status === statusFilter);
    }, [baseFilteredContracts, statusFilter]);

    // ── Pagination ──────────────────────────────────────────
    const totalCount = filteredContracts.length;
    const totalPages = pageSize === -1 ? 1 : Math.ceil(totalCount / pageSize);
    const pagedContracts = React.useMemo(() => {
        if (pageSize === -1) return filteredContracts;
        const from = (page - 1) * pageSize;
        return filteredContracts.slice(from, from + pageSize);
    }, [filteredContracts, page, pageSize]);

    React.useEffect(() => {
        setPage(1);
    }, [tab, statusFilter, searchTerm, pageSize, branchFilter, ptFilter]);

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setBranchFilter("all");
        setPtFilter("all");
        setPage(1);
        toast.info("Đã làm mới bộ lọc");
    };

    const counts = React.useMemo(() => {
        const cAll = contracts ?? [];
        const getCount = (period: string) => {
            const range = getPeriodRange(period);
            if (!range) return 0;
            return cAll.filter((c: any) => {
                if (!c.end_date) return false;
                const end = new Date(c.end_date);
                end.setHours(0, 0, 0, 0);

                if (period === "expired") return end < range.end;
                return isWithinInterval(end, { start: range.start, end: range.end });
            }).length;
        };

        return {
            thisWeek: getCount("this-week"),
            nextWeek: getCount("next-week"),
            nextMonth: getCount("next-month"),
            expired: getCount("expired"),
        };
    }, [contracts, getPeriodRange]);


    const getRemainingDays = (end_date: string) => {
        if (!end_date) return null;
        const end = new Date(end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const isExpiredTab = tab === "expired";

    return (
        <div className="space-y-6 font-inter pb-10">
            {/* Dialogs */}
            <ContractDetailsSheet
                contract={selectedContract}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onSuccess={refetch}
            />
            <ContractClosureDialog
                contract={closureContract}
                open={isClosureOpen}
                onOpenChange={setIsClosureOpen}
                onSuccess={refetch}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="rounded-xl hover:bg-gray-100"
                        >
                            <Link href="/contracts">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <CalendarClock className="w-8 h-8 text-red-600" />
                            Hợp đồng đến hạn & hết hạn
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight ml-12">
                        Theo dõi các hợp đồng sắp hết hạn và xử lý các hợp đồng đã hết hạn.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {selectedRows.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={handleBulkDelete}
                                    className="text-red-700 hover:text-red-800 hover:bg-red-50 font-medium px-4 h-11 rounded-xl border border-red-100"
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Xóa ({selectedRows.length})
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>


            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900 p-6">
                <div className="space-y-6">
                    {/* Period Tabs */}
                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap overflow-x-auto no-scrollbar gap-2 w-full justify-start py-1">
                            <TabsTrigger
                                value="this-week"
                                className={cn(
                                    "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-gray-100 dark:border-gray-800",
                                    "data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:border-red-600",
                                    "bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-300",
                                )}
                            >
                                Tuần này
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-lg text-[10px] font-bold",
                                    tab === 'this-week' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                )}>
                                    {counts.thisWeek}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="next-week"
                                className={cn(
                                    "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-gray-100 dark:border-gray-800",
                                    "data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:border-red-600",
                                    "bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-300",
                                )}
                            >
                                Tuần tới
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-lg text-[10px] font-bold",
                                    tab === 'next-week' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                )}>
                                    {counts.nextWeek}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="next-month"
                                className={cn(
                                    "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-gray-100 dark:border-gray-800",
                                    "data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:border-red-600",
                                    "bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-300",
                                )}
                            >
                                Tháng tới
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-lg text-[10px] font-bold",
                                    tab === 'next-month' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                )}>
                                    {counts.nextMonth}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="expired"
                                className={cn(
                                    "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-orange-100 dark:border-orange-950/30",
                                    "data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:border-red-600",
                                    "bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
                                )}
                            >
                                <AlertCircle className="w-3.5 h-3.5" />
                                Đã hết hạn
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-lg text-[10px] font-bold",
                                    tab === 'expired' ? "bg-white/20 text-white" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                                )}>
                                    {counts.expired}
                                </span>
                            </TabsTrigger>

                            <Select value={tab} onValueChange={setTab}>
                                <SelectTrigger
                                    className={cn(
                                        "h-9 px-4 rounded-xl border transition-all text-sm font-medium w-48 ml-auto",
                                        !['this-week', 'next-week', 'next-month', 'expired'].includes(tab)
                                            ? "bg-red-600 text-white border-red-600"
                                            : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-300"
                                    )}
                                >
                                    <SelectValue placeholder="Thêm..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                    <SelectItem value="last-week">Tuần trước</SelectItem>
                                    <SelectItem value="last-month">Tháng trước</SelectItem>
                                    <SelectItem value="this-month">Tháng này</SelectItem>
                                    <SelectItem value="this-quarter">Quý này</SelectItem>
                                    <SelectItem value="custom" className="text-blue-600 font-bold">Tùy chọn ngày</SelectItem>
                                </SelectContent>
                            </Select>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 flex-1">
                            <div className="relative group flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                <input
                                    placeholder="Tìm theo tên hội viên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 h-10 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium font-inter"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={branchFilter} onValueChange={setBranchFilter}>
                                    <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-4 shadow-none font-medium text-gray-500">
                                        <SelectValue placeholder="Chi nhánh" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        {(permissions.canViewAllBranches || allowedBranches.length > 1) && (
                                            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                                        )}
                                        {allowedBranches.map((branch: any) => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={ptFilter} onValueChange={setPtFilter}>
                                    <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-xs sm:text-sm lg:w-44 px-4 shadow-none font-medium text-gray-500">
                                        <SelectValue placeholder="Tất cả PT" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="all">Tất cả PT</SelectItem>
                                        {ptOptions.map((pt: string) => (
                                            <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="ghost"
                                    onClick={clearFilters}
                                    className="h-10 w-10 p-0 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all justify-center"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Status Tabs - Moved here */}
                    <Tabs
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        className="w-full"
                    >
                        <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap overflow-x-auto no-scrollbar gap-2 w-full justify-start py-1">
                            <TabsTrigger
                                value="all"
                                className={cn(
                                    "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-gray-100 dark:border-gray-800",
                                    "data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-red-200 data-[state=active]:text-red-600",
                                    "bg-white/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-300",
                                )}
                            >
                                Tất cả
                                <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {statusCounts.total}
                                </span>
                            </TabsTrigger>
                            {contractStatuses.map((s: any) => {
                                const statusColors: any = {
                                    "Đang tập": {
                                        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        inactive: "bg-emerald-50/30 text-emerald-600/70 border-emerald-100/50",
                                        badge: "bg-emerald-500 text-white",
                                    },
                                    "Chờ ký HĐ": {
                                        active: "bg-slate-100 text-slate-700 border-slate-300",
                                        inactive: "bg-slate-50/50 text-slate-500 border-slate-100",
                                        badge: "bg-slate-400 text-white",
                                    },
                                    "Hết hạn HĐ": {
                                        active: "bg-rose-50 text-rose-700 border-rose-200",
                                        inactive: "bg-rose-50/30 text-rose-600/70 border-rose-100/50",
                                        badge: "bg-rose-500 text-white",
                                    },
                                    "Hoàn thành": {
                                        active: "bg-blue-50 text-blue-700 border-blue-200",
                                        inactive: "bg-blue-50/30 text-blue-600/70 border-blue-100/50",
                                        badge: "bg-blue-500 text-white",
                                    },
                                    "Huỷ HĐ": {
                                        active: "bg-neutral-100 text-neutral-700 border-neutral-300",
                                        inactive: "bg-neutral-50/50 text-neutral-500 border-neutral-100",
                                        badge: "bg-neutral-400 text-white",
                                    },
                                    "Đã ký HĐ": {
                                        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        inactive: "bg-emerald-50/30 text-emerald-600/70 border-emerald-100/50",
                                        badge: "bg-emerald-500 text-white",
                                    },
                                    "Bảo lưu": {
                                        active: "bg-amber-50 text-amber-700 border-amber-200",
                                        inactive: "bg-amber-50/30 text-amber-600/70 border-amber-100/50",
                                        badge: "bg-amber-500 text-white",
                                    },
                                    "Đợi kích hoạt HĐ": {
                                        active: "bg-blue-50 text-blue-700 border-blue-200",
                                        inactive: "bg-blue-50/30 text-blue-600/70 border-blue-100/50",
                                        badge: "bg-blue-500 text-white",
                                    },
                                };
                                const colors = statusColors[s.nam] || {
                                    active: "bg-white text-red-600 border-red-200",
                                    inactive: "bg-white/50 text-gray-500 border-gray-100",
                                    badge: "bg-red-500 text-white",
                                };

                                return (
                                    <TabsTrigger
                                        key={`status-tab-${s.id}`}
                                        value={s.nam}
                                        className={cn(
                                            "flex shrink-0 items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-none border",
                                            "data-[state=active]:shadow-sm hover:scale-105 active:scale-95",
                                            colors.inactive,
                                            "data-[state=active]:" + colors.active.split(" ").join(" data-[state=active]:"),
                                        )}
                                    >
                                        {s.nam}
                                        <span className={cn("px-1.5 py-0.5 rounded-lg text-[10px] font-bold", colors.badge)}>
                                            {statusCounts[s.nam] || 0}
                                        </span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>

                    {/* Pagination controls (top) */}
                    {!isLoading && totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/10 gap-4 mt-1 rounded-b-xl">
                            <div className="flex items-center gap-4">
                                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                                    <span className="text-gray-900 dark:text-gray-100 font-black">
                                        {pagedContracts.length}
                                    </span>{" "}
                                    / {totalCount} hợp đồng
                                </div>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(v: string) => setPageSize(parseInt(v))}
                                >
                                    <SelectTrigger className="h-7 w-16 rounded-lg border-gray-100 dark:border-gray-800 text-[10px] font-bold focus:ring-red-500 bg-white dark:bg-gray-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="-1">Tất cả</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {pageSize !== -1 && totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800"
                                    >
                                        <ChevronLeft className="w-3 h-3 mr-1" />
                                        Trước
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map(
                                            (_, i) => {
                                                let pn =
                                                    page <= 3
                                                        ? i + 1
                                                        : page >= totalPages - 2
                                                            ? totalPages - 4 + i
                                                            : page - 2 + i;
                                                return (
                                                    <Button
                                                        key={pn}
                                                        variant={page === pn ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPage(pn)}
                                                        className={cn(
                                                            "w-7 h-7 rounded-lg p-0 text-[10px] font-black",
                                                            page === pn
                                                                ? "bg-red-600 hover:bg-red-700"
                                                                : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800",
                                                        )}
                                                    >
                                                        {pn}
                                                    </Button>
                                                );
                                            },
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className="rounded-lg border-gray-100 dark:border-gray-800 h-7 px-2 text-[10px] font-bold bg-white dark:bg-gray-800"
                                    >
                                        Sau
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-none">
                                    <TableHead className="w-12 pl-6 h-9">
                                        <Checkbox
                                            checked={
                                                selectedRows.length === pagedContracts.length &&
                                                pagedContracts.length > 0
                                            }
                                            onCheckedChange={toggleAll}
                                            className="rounded-lg border-gray-300 dark:border-gray-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Hợp đồng & Hội viên
                                    </TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Dịch vụ & Gói tập
                                    </TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Theo dõi cân nặng
                                    </TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Giá trị & Thanh toán
                                    </TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Chi nhánh và PT
                                    </TableHead>
                                    <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Ngày hợp đồng
                                    </TableHead>
                                    {isExpiredTab && (
                                        <TableHead className="text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                            Tình trạng
                                        </TableHead>
                                    )}
                                    <TableHead className="text-right pr-8 text-[11px] font-medium text-gray-400 dark:text-blue-300 h-9">
                                        Tùy chọn
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="pl-6">
                                                <Skeleton className="h-4 w-4" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </TableCell>
                                            {isExpiredTab && (
                                                <TableCell>
                                                    <Skeleton className="h-5 w-20" />
                                                </TableCell>
                                            )}
                                            <TableCell className="text-right pr-8">
                                                <Skeleton className="h-8 w-20 ml-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredContracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={isExpiredTab ? 9 : 8}
                                            className="h-48 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-gray-200" />
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium">
                                                    {isExpiredTab
                                                        ? "Không có hợp đồng đã hết hạn."
                                                        : "Không có hợp đồng nào đến hạn trong giai đoạn này."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pagedContracts.map((contract: any) => {
                                        const remainingDays = getRemainingDays(contract.end_date);
                                        const isExpired =
                                            remainingDays !== null && remainingDays <= 0;
                                        const isProcessed = !!contract.closure_status;

                                        return (
                                            <TableRow
                                                key={contract.id}
                                                onClick={(e) => handleRowClick(contract, e)}
                                                className={cn(
                                                    "border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group",
                                                    selectedRows.includes(contract.id) &&
                                                    "bg-red-50/30 dark:bg-red-950/20",
                                                    isExpired &&
                                                    !isProcessed &&
                                                    "bg-red-50/10 dark:bg-red-950/5",
                                                )}
                                            >
                                                <TableCell className="pl-6" data-no-click>
                                                    <Checkbox
                                                        checked={selectedRows.includes(contract.id)}
                                                        onCheckedChange={() => toggleRow(contract.id)}
                                                        className="rounded-lg"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-normal text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                            {contract.member_name}
                                                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {contract.id}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="flex items-center gap-1.5">
                                                            <Package className="w-3 h-3 text-gray-400" />
                                                            {contract.package_name || "Chưa chọn gói"}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                            <Clock className="w-3 h-3" />
                                                            {contract.contract_type || "Dịch vụ"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {contract.final_weight ? (
                                                        <div className="flex flex-col text-[10px] text-gray-600 dark:text-gray-300">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold text-gray-400 min-w-[20px]">
                                                                    BĐ:
                                                                </span>{" "}
                                                                {contract.initial_weight}kg
                                                            </div>
                                                            <div className="flex items-center gap-1 font-medium">
                                                                <span className="font-bold text-gray-400 min-w-[20px]">
                                                                    KT:
                                                                </span>{" "}
                                                                {contract.final_weight}kg
                                                            </div>
                                                            <div
                                                                className={cn(
                                                                    "flex items-center gap-1 font-bold mt-0.5",
                                                                    Number(contract.initial_weight || 0) -
                                                                        Number(contract.final_weight || 0) >
                                                                        0
                                                                        ? "text-emerald-600"
                                                                        : "text-amber-600",
                                                                )}
                                                            >
                                                                {Number(contract.initial_weight || 0) -
                                                                    Number(contract.final_weight || 0) >
                                                                    0 ? (
                                                                    <>
                                                                        <ChevronDown className="w-2.5 h-2.5" />
                                                                        Giảm{" "}
                                                                        {Number(contract.initial_weight || 0) -
                                                                            Number(contract.final_weight || 0)}
                                                                        kg
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ChevronUp className="w-2.5 h-2.5" />
                                                                        Tăng{" "}
                                                                        {Math.abs(
                                                                            Number(contract.initial_weight || 0) -
                                                                            Number(contract.final_weight || 0),
                                                                        )}
                                                                        kg
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic">
                                                            Chưa có dữ liệu
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                        <span className="text-sm font-medium text-red-600">
                                                            {contract.total_amount
                                                                ? Number(contract.total_amount).toLocaleString(
                                                                    "vi-VN",
                                                                ) + " ₫"
                                                                : "0 ₫"}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                            <CreditCard className="w-3 h-3" />
                                                            {contract.payment_method || "N/A"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 className="w-3 h-3 text-gray-400" />
                                                            {contract.branches?.name || "Văn phòng"}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                                            <User className="w-3 h-3" />
                                                            {contract.trainer_name || "Chưa có PT"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-[11px] text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>
                                                                Ký:{" "}
                                                                {contract.start_date
                                                                    ? new Date(
                                                                        contract.start_date,
                                                                    ).toLocaleDateString("vi-VN")
                                                                    : "-"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3 h-3" />
                                                            <span>
                                                                Hết:{" "}
                                                                {contract.end_date
                                                                    ? new Date(
                                                                        contract.end_date,
                                                                    ).toLocaleDateString("vi-VN")
                                                                    : "-"}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "mt-1 font-bold",
                                                                isExpired ? "text-red-500" : "text-blue-500",
                                                            )}
                                                        >
                                                            {isExpired
                                                                ? `Quá hạn ${Math.abs(remainingDays!)} ngày`
                                                                : remainingDays !== null
                                                                    ? `Còn ${remainingDays} ngày`
                                                                    : "-"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                {isExpiredTab && (
                                                    <TableCell data-no-click>
                                                        <div className="flex flex-col gap-1.5">
                                                            <ClosureStatusBadge
                                                                status={contract.closure_status}
                                                            />
                                                            {contract.final_weight && (
                                                                <div className="flex flex-col text-[10px] bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-800/50">
                                                                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-1 mb-1">
                                                                        <span className="text-gray-400 font-medium">BĐ: {contract.initial_weight}kg</span>
                                                                        <span className="text-gray-900 dark:text-gray-100 font-bold">KT: {contract.final_weight}kg</span>
                                                                    </div>
                                                                    <div className={cn(
                                                                        "flex items-center gap-1 font-bold",
                                                                        Number(contract.initial_weight || 0) - Number(contract.final_weight || 0) > 0
                                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                                            : "text-amber-600 dark:text-amber-400"
                                                                    )}>
                                                                        {Number(contract.initial_weight || 0) - Number(contract.final_weight || 0) > 0 ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />}
                                                                        {Number(contract.initial_weight || 0) - Number(contract.final_weight || 0) > 0 ? "Giảm" : "Tăng"}{" "}
                                                                        {Math.abs(Number(contract.initial_weight || 0) - Number(contract.final_weight || 0))}kg
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right pr-8" data-no-click>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Nút Xử lý HĐ — chỉ hiện tab expired */}
                                                        {isExpiredTab && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => handleOpenClosure(contract, e)}
                                                                className={cn(
                                                                    "h-8 px-3 rounded-lg text-[11px] font-semibold transition-all",
                                                                    isProcessed
                                                                        ? "text-gray-500 hover:bg-gray-50 border border-gray-100"
                                                                        : "text-orange-600 hover:bg-orange-50 border border-orange-100 dark:border-orange-900/30 dark:hover:bg-orange-950/20",
                                                                )}
                                                            >
                                                                <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                                                                {isProcessed ? "Cập nhật" : "Xử lý HĐ"}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedContract(contract);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className="w-8 h-8 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(contract.id);
                                                            }}
                                                            className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Card>
        </div>
    );
}
