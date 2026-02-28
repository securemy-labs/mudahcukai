import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, HelpCircle, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Tax brackets for YA 2025
const TAX_BRACKETS = [
  { min: 0, max: 5000, rate: 0 },
  { min: 5001, max: 20000, rate: 0.01 },
  { min: 20001, max: 35000, rate: 0.03 },
  { min: 35001, max: 50000, rate: 0.06 },
  { min: 50001, max: 70000, rate: 0.11 },
  { min: 70001, max: 100000, rate: 0.19 },
  { min: 100001, max: 400000, rate: 0.25 },
  { min: 400001, max: 600000, rate: 0.26 },
  { min: 600001, max: 2000000, rate: 0.28 },
  { min: 2000001, max: Infinity, rate: 0.30 },
];

interface TaxCalculation {
  grossIncome: number;
  totalDeductions: number;
  individualSpouseRelief: number;
  childRelief: number;
  parentRelief: number;
  otherRelief: number;
  taxableIncome: number;
  taxAmount: number;
  taxByBracket: Array<{ min: number; max: number; amount: number; rate: number }>;
  zakatAmount: number;
  taxRebate: number;
  finalTax: number;
  averageTaxRate: number;
}

function calculateTaxForIncome(
  income: number,
  deductions: number,
  zakatAmount: number
): number {
  const taxableIncome = Math.max(0, income - deductions);
  let tax = 0;

  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.min) break;
    const incInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += incInBracket * bracket.rate;
  }

  return Math.max(0, tax - zakatAmount - 400);
}

export default function Home() {
  // Income
  const [grossIncome, setGrossIncome] = useState(40000);
  const [hasCompensation, setHasCompensation] = useState(false);
  const [compensationAmount, setCompensationAmount] = useState(0);

  // Personal Details
  const [isDisabled, setIsDisabled] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState("single");
  const [hasChild, setHasChild] = useState(false);
  const [spouseDisabled, setSpouseDisabled] = useState(false);
  const [spouseWorking, setSpouseWorking] = useState(false);

  // Tax Reliefs - Parent Details
  const [parentMedical, setParentMedical] = useState(0);
  const [prs, setPrs] = useState(0);
  const [medicalInsurance, setMedicalInsurance] = useState(0);
  const [eduSelf, setEduSelf] = useState(0);
  const [supportEquip, setSupportEquip] = useState(0);
  const [medical, setMedical] = useState(0);
  const [epf, setEpf] = useState(0);
  const [lifeInsurance, setLifeInsurance] = useState(0);
  const [lifestyle, setLifestyle] = useState(0);
  const [sportEquip, setSportEquip] = useState(0);
  const [socso, setSocso] = useState(0);
  const [ev, setEv] = useState(0);
  const [pcb, setPcb] = useState(0);
  const [zakat, setZakat] = useState(0);

  // Business Income
  const [useBusinessIncome, setUseBusinessIncome] = useState(false);
  const [annualSales, setAnnualSales] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [managerSalary, setManagerSalary] = useState(0);
  const [otherExpenses, setOtherExpenses] = useState(0);

  // UI State
  const [showTaxRate, setShowTaxRate] = useState(false);
  const [showReverseCalculator, setShowReverseCalculator] = useState(false);
  const [desiredTaxAmount, setDesiredTaxAmount] = useState(0);
  const [calculatedGrossIncome, setCalculatedGrossIncome] = useState(0);

  // Calculate tax
  const calculation = useMemo(() => {
    let totalIncome = 0;
    
    // Calculate income based on source
    if (useBusinessIncome) {
      // Business income calculation: (Annual Sales × Profit Margin) + Manager Salary + Other Expenses
      const grossProfit = annualSales * (profitMargin / 100);
      totalIncome = grossProfit + managerSalary + otherExpenses;
    } else {
      // Personal income
      totalIncome = grossIncome + (hasCompensation ? compensationAmount : 0);
    }
    
    // Calculate deductions
    let individualSpouseRelief = 9000; // Individual relief
    let childRelief = 0;
    let parentRelief = 0;
    let otherRelief = 0;

    // Spouse relief
    if (maritalStatus === "married" && !spouseWorking) {
      individualSpouseRelief += 4000;
    }

    // Spouse disability relief
    if (spouseDisabled) {
      individualSpouseRelief += 3500;
    }

    // Other reliefs
    otherRelief += Math.min(parentMedical, 8000);
    otherRelief += Math.min(prs, 3000);
    otherRelief += Math.min(medicalInsurance, 4000);
    otherRelief += Math.min(eduSelf, 7000);
    otherRelief += Math.min(supportEquip, 6000);
    otherRelief += Math.min(medical, 10000);
    otherRelief += Math.min(epf, 4000);
    otherRelief += Math.min(lifeInsurance, 3000);
    otherRelief += Math.min(lifestyle, 2500);
    otherRelief += Math.min(sportEquip, 1000);
    otherRelief += Math.min(socso, 350);
    otherRelief += Math.min(ev, 2500);
    otherRelief += Math.min(pcb, 2500);

    const totalDeductions = individualSpouseRelief + childRelief + parentRelief + otherRelief + zakat;
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    // Calculate tax by bracket
    let taxAmount = 0;
    const taxByBracket: Array<{ min: number; max: number; amount: number; rate: number }> = [];

    for (const bracket of TAX_BRACKETS) {
      if (taxableIncome <= bracket.min) break;

      const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      const taxInBracket = incomeInBracket * bracket.rate;
      taxAmount += taxInBracket;

      if (incomeInBracket > 0) {
        taxByBracket.push({
          min: bracket.min,
          max: bracket.max,
          amount: taxInBracket,
          rate: bracket.rate * 100,
        });
      }
    }

    // Tax rebate (RM 400 standard)
    const taxRebate = 400;
    const finalTax = Math.max(0, taxAmount - zakat - taxRebate);
    const averageTaxRate = taxableIncome > 0 ? (finalTax / taxableIncome) * 100 : 0;

    return {
      grossIncome: totalIncome,
      totalDeductions,
      individualSpouseRelief,
      childRelief,
      parentRelief,
      otherRelief,
      taxableIncome,
      taxAmount,
      taxByBracket,
      zakatAmount: zakat,
      taxRebate,
      finalTax,
      averageTaxRate,
    };
  }, [
    grossIncome, hasCompensation, compensationAmount, maritalStatus,
    spouseDisabled, spouseWorking, isDisabled, hasChild,
    parentMedical, prs, medicalInsurance, eduSelf, supportEquip, medical,
    epf, lifeInsurance, lifestyle, sportEquip, socso, ev, pcb, zakat,
    useBusinessIncome, annualSales, profitMargin, managerSalary, otherExpenses
  ]);

  // Calculate total deductions for reverse calculator
  const getTotalDeductions = () => {
    let indSpouseRelief = 9000;
    if (maritalStatus === "married" && !spouseWorking) {
      indSpouseRelief += 4000;
    }
    if (spouseDisabled) {
      indSpouseRelief += 3500;
    }

    let otherRel = 0;
    otherRel += Math.min(parentMedical, 8000);
    otherRel += Math.min(prs, 3000);
    otherRel += Math.min(medicalInsurance, 4000);
    otherRel += Math.min(eduSelf, 7000);
    otherRel += Math.min(supportEquip, 6000);
    otherRel += Math.min(medical, 10000);
    otherRel += Math.min(epf, 4000);
    otherRel += Math.min(lifeInsurance, 3000);
    otherRel += Math.min(lifestyle, 2500);
    otherRel += Math.min(sportEquip, 1000);
    otherRel += Math.min(socso, 350);
    otherRel += Math.min(ev, 2500);
    otherRel += Math.min(pcb, 2500);

    return indSpouseRelief + otherRel + zakat;
  };

  const handleReverseCalculate = () => {
    const totalDed = getTotalDeductions();
    
    // Binary search to find income that results in desired tax
    let low = 0;
    let high = 10000000;
    let result = 0;

    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const calculatedTax = calculateTaxForIncome(mid, totalDed, zakat);
      
      if (calculatedTax < desiredTaxAmount) {
        low = mid;
      } else {
        high = mid;
      }
      result = mid;
    }
    
    setCalculatedGrossIncome(Math.round(result));
    setShowReverseCalculator(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold mb-2">SQL Professional Tax Calculator & Tax Planner Malaysia</h1>
            <p className="text-lg opacity-90">for Income Tax 2026</p>
          </div>
          <div className="flex justify-center items-center gap-4">
            <span className="text-xl font-semibold">YA 2025</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income Details Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground px-6 py-4 font-semibold">
                Income Details
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Income Source</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useBusinessIncome}
                        onChange={() => setUseBusinessIncome(false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Personal Income</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useBusinessIncome}
                        onChange={() => setUseBusinessIncome(true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Business Income</span>
                    </label>
                  </div>
                </div>

                {!useBusinessIncome && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Total Annual Income
                        <span className="text-xs text-gray-500 block">(Exclude rental income and dividends)</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">RM</span>
                        <Input
                          type="number"
                          value={grossIncome}
                          onChange={(e) => setGrossIncome(Number(e.target.value))}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!hasCompensation}
                            onChange={() => setHasCompensation(false)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">No</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={hasCompensation}
                            onChange={() => setHasCompensation(true)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                      </div>
                      <Label className="text-sm font-medium">Do you get compensation for loss of employment?</Label>
                      {hasCompensation && (
                        <Input
                          type="number"
                          value={compensationAmount}
                          onChange={(e) => setCompensationAmount(Number(e.target.value))}
                          placeholder="Compensation Amount Received"
                          className="mt-2"
                        />
                      )}
                    </div>
                  </>
                )}

                {useBusinessIncome && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Annual Sales</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">RM</span>
                        <Input
                          type="number"
                          value={annualSales}
                          onChange={(e) => setAnnualSales(Number(e.target.value))}
                          placeholder="Total annual sales"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Profit Margin (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={profitMargin}
                          onChange={(e) => setProfitMargin(Number(e.target.value))}
                          placeholder="Profit margin percentage"
                          className="flex-1"
                        />
                        <span className="text-gray-600">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Gross Profit = Annual Sales x Profit Margin</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Annual Manager Salary</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">RM</span>
                        <Input
                          type="number"
                          value={managerSalary}
                          onChange={(e) => setManagerSalary(Number(e.target.value))}
                          placeholder="Manager salary"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Other Expenses</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">RM</span>
                        <Input
                          type="number"
                          value={otherExpenses}
                          onChange={(e) => setOtherExpenses(Number(e.target.value))}
                          placeholder="Other business expenses"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {annualSales > 0 && profitMargin > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-gray-600 mb-2">Business Income Calculation:</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Gross Profit (Sales x Margin)</span>
                            <span className="font-semibold">RM {(annualSales * (profitMargin / 100)).toLocaleString('en-US', {maximumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>+ Manager Salary</span>
                            <span className="font-semibold">RM {managerSalary.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>+ Other Expenses</span>
                            <span className="font-semibold">RM {otherExpenses.toLocaleString()}</span>
                          </div>
                          <div className="border-t pt-1 mt-1 flex justify-between font-bold text-blue-700">
                            <span>Total Business Income</span>
                            <span>RM {(annualSales * (profitMargin / 100) + managerSalary + otherExpenses).toLocaleString('en-US', {maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tax Relief Details Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground px-6 py-4 font-semibold flex justify-between items-center cursor-pointer">
                <span>Tax Relief Details</span>
                <ChevronUp className="w-5 h-5" />
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Are you disabled?</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isDisabled}
                          onChange={() => setIsDisabled(false)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">No</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={isDisabled}
                          onChange={() => setIsDisabled(true)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Marital Status</Label>
                    <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorce / Widow / Widower</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Do you have child?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!hasChild}
                        onChange={() => setHasChild(false)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">No</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={hasChild}
                        onChange={() => setHasChild(true)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                  </div>
                </div>

                {maritalStatus === "married" && (
                  <>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Is your husband / wife disabled?</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={!spouseDisabled}
                              onChange={() => setSpouseDisabled(false)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">No</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={spouseDisabled}
                              onChange={() => setSpouseDisabled(true)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Is your husband / wife working?</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={spouseWorking}
                              onChange={() => setSpouseWorking(true)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={!spouseWorking}
                              onChange={() => setSpouseWorking(false)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Parent Details Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground px-6 py-4 font-semibold">
                Other Details
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Parent Medical
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 8,000</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={parentMedical}
                        onChange={(e) => setParentMedical(Math.min(Number(e.target.value), 8000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 8,000]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Annuity / PRS
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 3,000</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={prs}
                        onChange={(e) => setPrs(Math.min(Number(e.target.value), 3000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 3,000]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Education & Medical Insurance (Self/Spouse/Child)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={medicalInsurance}
                        onChange={(e) => setMedicalInsurance(Math.min(Number(e.target.value), 4000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 4,000]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Education Fees (Self)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 7,000</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={eduSelf}
                        onChange={(e) => setEduSelf(Math.min(Number(e.target.value), 7000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 7,000]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Supporting Equipment
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 6,000</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={supportEquip}
                        onChange={(e) => setSupportEquip(Math.min(Number(e.target.value), 6000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 6,000]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Medical Expenses (Self/Spouse/Child)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 10,000</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={medical}
                        onChange={(e) => setMedical(Math.min(Number(e.target.value), 10000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 10,000]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">EPF / KWSP</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={epf}
                        onChange={(e) => setEpf(Math.min(Number(e.target.value), 4000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 4,000]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Life Insurance / Family Takaful / Additional Voluntary Contribution to EPF</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={lifeInsurance}
                        onChange={(e) => setLifeInsurance(Math.min(Number(e.target.value), 3000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 3,000]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Lifestyle
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 2,500</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={lifestyle}
                        onChange={(e) => setLifestyle(Math.min(Number(e.target.value), 2500))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 2,500]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Sport Equipment & Activities (Self/Spouse/Child)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 1,000</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={sportEquip}
                        onChange={(e) => setSportEquip(Math.min(Number(e.target.value), 1000))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 1,000]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">SOCSO / PERKESO</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={socso}
                        onChange={(e) => setSocso(Math.min(Number(e.target.value), 350))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 350]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Electric Vehicle Charging Facilities & Food Waste Composting Machines
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Limited to 2,500</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={ev}
                        onChange={(e) => setEv(Math.min(Number(e.target.value), 2500))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 2,500]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">PCB</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={pcb}
                        onChange={(e) => setPcb(Math.min(Number(e.target.value), 2500))}
                        className="flex-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500">[Limited to 2,500]</span>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      Zakat
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>Unlimited</TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">RM</span>
                      <Input
                        type="number"
                        value={zakat}
                        onChange={(e) => setZakat(Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold rounded">
              Calculate Tax
            </Button>

            {/* Reverse Tax Calculator Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="bg-yellow-100 rounded-full p-2 flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">How if I wish to pay a lower tax amount?</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tax amount I wish to pay is RM</Label>
                  <Input
                    type="number"
                    value={desiredTaxAmount}
                    onChange={(e) => setDesiredTaxAmount(Number(e.target.value))}
                    placeholder="Enter desired tax amount"
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleReverseCalculate}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 font-semibold rounded"
                >
                  Calculate Gross Income
                </Button>

                {showReverseCalculator && calculatedGrossIncome > 0 && (
                  <div className="bg-white border border-gray-300 rounded p-4 mt-4">
                    <p className="text-sm text-gray-600 mb-2">To pay a tax of <span className="font-semibold">RM {desiredTaxAmount.toLocaleString()}</span>, your gross income should be:</p>
                    <p className="text-2xl font-bold text-primary">RM {calculatedGrossIncome.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Rate Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowTaxRate(!showTaxRate)}
                className="w-full bg-gray-100 hover:bg-gray-200 px-6 py-4 font-semibold flex justify-between items-center text-left rounded-t-lg"
              >
                <span>Tax Rate</span>
                {showTaxRate ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showTaxRate && (
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Chargeable Income</th>
                        <th className="text-left py-2">Calculation (RM)</th>
                        <th className="text-left py-2">Rate %</th>
                        <th className="text-left py-2">Tax RM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAX_BRACKETS.map((bracket, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            {bracket.min.toLocaleString()} - {bracket.max === Infinity ? "Above 2,000,000" : bracket.max.toLocaleString()}
                          </td>
                          <td className="py-2">
                            On the First {bracket.min.toLocaleString()}
                            {bracket.max !== Infinity && <div>Next {(bracket.max - bracket.min).toLocaleString()}</div>}
                          </td>
                          <td className="py-2">{(bracket.rate * 100).toFixed(0)}</td>
                          <td className="py-2">Calculated</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gray-800 text-white rounded-lg overflow-hidden">
                <div className="bg-gray-900 px-6 py-4 font-semibold">
                  Income Tax Summary YA 2025
                </div>
                <div className="p-6 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Income Before Deduction</span>
                    <span className="font-semibold">{calculation.grossIncome.toLocaleString()}</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-red-400">Tax Deductions</span>
                      <span className="font-semibold text-red-400">- {calculation.totalDeductions.toLocaleString()}</span>
                    </div>
                    <div className="text-xs space-y-1 ml-4">
                      <div className="flex justify-between">
                        <span>Individual / Spouse Relief</span>
                        <span>{calculation.individualSpouseRelief.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Child Relief</span>
                        <span>{calculation.childRelief.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parent Relief</span>
                        <span>{calculation.parentRelief.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Relief</span>
                        <span>{calculation.otherRelief.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex justify-between">
                    <span>Taxable Income</span>
                    <span className="font-semibold">{calculation.taxableIncome.toLocaleString()}</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Tax Amount</span>
                      <span className="font-semibold">{calculation.taxAmount.toFixed(0)}</span>
                    </div>
                    <div className="text-xs space-y-1 ml-4">
                      {calculation.taxByBracket.map((bracket, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{(bracket.max - bracket.min).toLocaleString()} x {bracket.rate.toFixed(0)}% =</span>
                          <span>{bracket.amount.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-red-400">
                      <span>Less Zakat</span>
                      <span>- {calculation.zakatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Less Tax Rebate</span>
                      <span>- {calculation.taxRebate.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Tax You Should Pay</span>
                    <span>RM {calculation.finalTax.toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-4 text-xs">
                    <div className="flex justify-between">
                      <span>Average Tax Rate</span>
                      <span>({calculation.finalTax.toFixed(0)}/{calculation.taxableIncome.toLocaleString()}) x 100% = {calculation.averageTaxRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
