const Transaction = require("../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const getDashboardData = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find();
  const activeTransactions = transactions.filter((transaction) => !transaction.isDeleted);

  if (activeTransactions.length === 0) {
    return successResponse(res, "Dashboard data fetched", {
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        totalExpenses: 0,
        netBalance: 0,
      },
      categoryTotals: [],
      categoryWise: [],
      monthlyTrends: [],
      recentTransactions: [],
    });
  }

  const income = activeTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = activeTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const categoryMap = activeTransactions.reduce((acc, transaction) => {
    const categoryName = transaction.category;

    if (!acc[categoryName]) {
      acc[categoryName] = {
        category: categoryName,
        income: 0,
        expense: 0,
        totalTransactions: 0,
      };
    }

    acc[categoryName][transaction.type] += transaction.amount;
    acc[categoryName].totalTransactions += 1;

    return acc;
  }, {});

  const categoryWise = Object.values(categoryMap).sort(
    (a, b) => b.income + b.expense - (a.income + a.expense)
  );

  const monthlyMap = activeTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;

    if (!acc[key]) {
      acc[key] = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        income: 0,
        expense: 0,
      };
    }

    acc[key][transaction.type] += transaction.amount;
    return acc;
  }, {});

  const monthlyTrends = Object.values(monthlyMap)
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }

      return a.month - b.month;
    })
    .map((item) => ({
      ...item,
      net: item.income - item.expense,
    }));

  const recentTransactions = [...activeTransactions]
    .sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 5);

  return successResponse(res, "Dashboard data fetched", {
    summary: {
      totalIncome: income,
      totalExpense: expenses,
      totalExpenses: expenses,
      netBalance: income - expenses,
    },
    categoryTotals: categoryWise,
    categoryWise,
    monthlyTrends,
    recentTransactions,
  });
});

module.exports = {
  getDashboardData,
};
