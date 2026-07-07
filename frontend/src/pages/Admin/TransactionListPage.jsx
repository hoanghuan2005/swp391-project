import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Search, ArrowUpRight, CheckCircle2, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import AdminToolbar from "@/components/admin/AdminToolbar";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function TransactionListPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/api/admin/payments");
      setTransactions(response.data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTxns = transactions.filter((t) => {
    const keyword = searchQuery.trim().toLowerCase();
    const matchesSearch =
      t.txnRef?.toLowerCase().includes(keyword) ||
      t.email?.toLowerCase().includes(keyword) ||
      t.username?.toLowerCase().includes(keyword) ||
      t.vnpTransactionNo?.toLowerCase().includes(keyword);

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    let totalRevenue = 0;
    let successCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    transactions.forEach((t) => {
      if (t.status === "SUCCESS" || t.status === "PAID") {
        totalRevenue += t.amountVnd || 0;
        successCount++;
      } else if (t.status === "FAILED") {
        failedCount++;
      } else {
        pendingCount++;
      }
    });

    return { totalRevenue, successCount, failedCount, pendingCount };
  }, [transactions]);

  // Export Columns definition
  const columnsForExport = [
    { header: "Txn Ref", render: (item) => item.txnRef || "" },
    { header: "Amount (VND)", render: (item) => item.amountVnd || 0 },
    { header: "Order Info", render: (item) => item.orderInfo || "" },
    { header: "Status", render: (item) => item.status || "" },
    { header: "VNPay No", render: (item) => item.vnpTransactionNo || "" },
    { header: "Bank Code", render: (item) => item.vnpBankCode || "" },
    { header: "Pay Date", render: (item) => item.vnpPayDate || "" },
    { header: "User Email", render: (item) => item.email || "" },
    { header: "Username", render: (item) => item.username || "" },
    { header: "Created At", render: (item) => item.createdAt || "" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f26522]">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Subscription Transactions
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Monitor VNPay payments, upgrade requests, and system revenue.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-orange-50/50 to-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {currencyFormatter.format(stats.totalRevenue)}
              </h3>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Lifetime revenue
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-[#f26522]">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Successful Payments
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {stats.successCount}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Completed invoices</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Failed Payments
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {stats.failedCount}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Incomplete attempts</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pending Requests
              </p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                {stats.pendingCount}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Awaiting confirmation</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between pb-6">
          <CardTitle className="text-lg text-slate-700 font-bold">
            Transactions directory
          </CardTitle>
          <div className="w-full">
            <AdminToolbar
              searchVal={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search transactions..."
              showImport={false}
              exportData={filteredTxns}
              exportColumns={columnsForExport}
              exportFilename="vnpay_transactions_export.csv"
              activeFiltersCount={statusFilter !== "ALL" ? 1 : 0}
              onClearFilters={() => setStatusFilter("ALL")}
              filters={
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold outline-none focus:border-[#f26522]/40 focus:ring-1 focus:ring-[#f26522]/20 transition-all cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="SUCCESS">Success</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              }
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Loading transactions database...
            </div>
          ) : filteredTxns.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No transactions match the filter.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[15%]">
                      Txn Ref / Date
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[25%]">
                      User
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[15%]">
                      Amount
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[25%]">
                      VNPay Details
                    </TableHead>
                    <TableHead className="text-slate-600 font-bold text-xs uppercase w-[10%] text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTxns.map((t) => {
                    const isSuccess = t.status === "SUCCESS" || t.status === "PAID";
                    const isFailed = t.status === "FAILED";

                    return (
                      <TableRow key={t.id} className="hover:bg-slate-50/30">
                        <TableCell>
                          <div className="font-semibold text-slate-700">{t.txnRef}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(t.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {t.email ? (
                            <div>
                              <div className="font-semibold text-slate-700">{t.username}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{t.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">
                          {currencyFormatter.format(t.amountVnd || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-600 font-medium">
                            No: <span className="font-bold text-slate-700">{t.vnpTransactionNo || "-"}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Bank: {t.vnpBankCode || "-"} | {t.orderInfo}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`rounded-full px-2.5 py-1 text-xs border-none font-bold shadow-none ${
                              isSuccess
                                ? "bg-green-50 text-green-700"
                                : isFailed
                                ? "bg-red-50 text-red-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
