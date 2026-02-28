import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, HelpCircle, Download } from "lucide-react";
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
  taxableIncome: number;
  taxAmount: number;
  taxByBracket: Array<{ bracket: string; amount: number; rate: number }>;
  averageTaxRate: number;
}

export default function Home() {
  // Income inputs
  const [grossIncome, setGrossIncome] = useState(40000);
  const [compensationAmount, setCompensationAmount] = useState(0);
  const [hasCompensation, setHasCompensation] = useState(false);

  // Personal details
  const [maritalStatus, setMaritalStatus] = useState("single");
  const [spouseDisabled, setSpouseDisabled] = useState(false);
  const [spouseWorking, setSpouseWorking] = useState(false);
  const [alimony, setAlimony] = useState(0);

  // Tax reliefs
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
  const [zakat, setZakat] = useState(0);

  // Calculate tax
  const calculation = useMemo(() => {
    let totalIncome = grossIncome + (hasCompensation ? compensationAmount : 0);
    
    // Calculate deductions
    let deductions = 0;
    
    // Personal relief
    deductions += 9000; // Individual relief
    
    // Spouse relief
    if (maritalStatus === "married" && !spouseWorking) {
      deductions += 4000;
    }
    
    // Spouse disability relief
    if (spouseDisabled) {
      deductions += 3500;
    }
    
    // Alimony (limited to 4,000)
    deductions += Math.min(alimony, 4000);
    
    // Medical reliefs
    deductions += Math.min(parentMedical, 8000);
    deductions += Math.min(prs, 4000);
    deductions += Math.min(medicalInsurance, 4000);
    deductions += Math.min(eduSelf, 7000);
    deductions += Math.min(supportEquip, 6000);
    deductions += Math.min(medical, 8000);
    deductions += Math.min(epf, 4000);
    deductions += Math.min(lifeInsurance, 3000);
    deductions += Math.min(lifestyle, 2500);
    deductions += Math.min(sportEquip, 500);
    deductions += Math.min(socso, 350);
    deductions += Math.min(ev, 10000);
    deductions += zakat; // Unlimited
    
    const taxableIncome = Math.max(0, totalIncome - deductions);
    
    // Calculate tax by bracket
    let taxAmount = 0;
    const taxByBracket: Array<{ bracket: string; amount: number; rate: number }> = [];
    
    for (const bracket of TAX_BRACKETS) {
      if (taxableIncome <= bracket.min) break;
      
      const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      const taxInBracket = incomeInBracket * bracket.rate;
      taxAmount += taxInBracket;
      
      if (incomeInBracket > 0) {
        taxByBracket.push({
          bracket: `RM ${bracket.min.toLocaleString()} - RM ${bracket.max === Infinity ? "Above 2,000,000" : bracket.max.toLocaleString()}`,
          amount: taxInBracket,
          rate: bracket.rate * 100,
        });
      }
    }
    
    const averageTaxRate = taxableIncome > 0 ? (taxAmount / taxableIncome) * 100 : 0;
    
    return {
      grossIncome: totalIncome,
      totalDeductions: deductions,
      taxableIncome,
      taxAmount,
      taxByBracket,
      averageTaxRate,
    };
  }, [
    grossIncome, hasCompensation, compensationAmount, maritalStatus,
    spouseDisabled, spouseWorking, alimony, parentMedical, prs,
    medicalInsurance, eduSelf, supportEquip, medical, epf, lifeInsurance,
    lifestyle, sportEquip, socso, ev, zakat
  ]);

  const handleDownloadSummary = () => {
    const summary = `
MUDAHCUKAI - MALAYSIA INCOME TAX CALCULATION SUMMARY
Year of Assessment: 2025
Generated: ${new Date().toLocaleDateString()}

=== INCOME DETAILS ===
Gross Annual Income: RM ${calculation.grossIncome.toLocaleString()}

=== TAX RELIEFS ===
Total Deductions: RM ${calculation.totalDeductions.toLocaleString()}

=== CALCULATION ===
Taxable Income: RM ${calculation.taxableIncome.toLocaleString()}
Total Tax Payable: RM ${calculation.taxAmount.toFixed(2)}
Average Tax Rate: ${calculation.averageTaxRate.toFixed(2)}%

=== TAX BREAKDOWN BY BRACKET ===
${calculation.taxByBracket.map(b => `${b.bracket} @ ${b.rate}%: RM ${b.amount.toFixed(2)}`).join('\n')}

---
This calculation is based on LHDN Malaysia tax brackets for YA 2025.
Please verify with official LHDN sources before submission.
    `;
    
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(summary));
    element.setAttribute("download", "mudahcukai-tax-summary.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Mudahcukai</h1>
                <p className="text-xs text-muted-foreground">Malaysia Income Tax Calculator</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Year of Assessment: 2025
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663391007656/Gw3eWkUKzaJxaPSaXRSvKJ/hero-background-Le3BiexmrLbQm5qNSoPuB5.webp"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Calculate Your Income Tax
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Accurate, transparent tax calculations based on LHDN Malaysia's official tax brackets and reliefs for 2025.
            </p>
          </div>
        </div>
      </section>

      {/* Main Calculator */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Income Details */}
              <Card className="p-6 border-border shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Income Details</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter your total annual income excluding rental and dividend income</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="income" className="text-sm font-medium">
                      Total Annual Income (RM)
                    </Label>
                    <Input
                      id="income"
                      type="number"
                      value={grossIncome}
                      onChange={(e) => setGrossIncome(Number(e.target.value))}
                      className="mt-2 text-lg font-semibold"
                      placeholder="0"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="compensation"
                        checked={hasCompensation}
                        onChange={(e) => setHasCompensation(e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <label htmlFor="compensation" className="text-sm font-medium cursor-pointer">
                        Compensation for loss of employment?
                      </label>
                    </div>
                    {hasCompensation && (
                      <Input
                        type="number"
                        value={compensationAmount}
                        onChange={(e) => setCompensationAmount(Number(e.target.value))}
                        placeholder="Compensation amount"
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </Card>

              {/* Personal Details */}
              <Card className="p-6 border-border shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-foreground mb-6">Personal Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="marital" className="text-sm font-medium">
                      Marital Status
                    </Label>
                    <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                      <SelectTrigger id="marital" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced / Widow / Widower</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {maritalStatus === "married" && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="spouseDisabled"
                          checked={spouseDisabled}
                          onChange={(e) => setSpouseDisabled(e.target.checked)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="spouseDisabled" className="text-sm font-medium cursor-pointer">
                          Is your spouse disabled?
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="spouseWorking"
                          checked={spouseWorking}
                          onChange={(e) => setSpouseWorking(e.target.checked)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="spouseWorking" className="text-sm font-medium cursor-pointer">
                          Is your spouse working?
                        </label>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="alimony" className="text-sm font-medium">
                      Alimony Payments (RM) - Limited to RM 4,000
                    </Label>
                    <Input
                      id="alimony"
                      type="number"
                      value={alimony}
                      onChange={(e) => setAlimony(Math.min(Number(e.target.value), 4000))}
                      className="mt-2"
                      placeholder="0"
                    />
                  </div>
                </div>
              </Card>

              {/* Tax Reliefs */}
              <Card className="p-6 border-border shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-foreground mb-6">Tax Reliefs</h3>
                
                <Tabs defaultValue="medical" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                  </TabsList>

                  <TabsContent value="medical" className="space-y-4">
                    <div>
                      <Label htmlFor="parentMedical" className="text-sm font-medium">
                        Parent Medical Expenses (RM) - Limited to RM 8,000
                      </Label>
                      <Input
                        id="parentMedical"
                        type="number"
                        value={parentMedical}
                        onChange={(e) => setParentMedical(Math.min(Number(e.target.value), 8000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="medicalInsurance" className="text-sm font-medium">
                        Medical Insurance (RM) - Limited to RM 4,000
                      </Label>
                      <Input
                        id="medicalInsurance"
                        type="number"
                        value={medicalInsurance}
                        onChange={(e) => setMedicalInsurance(Math.min(Number(e.target.value), 4000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="medical" className="text-sm font-medium">
                        Self Medical Expenses (RM) - Limited to RM 8,000
                      </Label>
                      <Input
                        id="medical"
                        type="number"
                        value={medical}
                        onChange={(e) => setMedical(Math.min(Number(e.target.value), 8000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lifeInsurance" className="text-sm font-medium">
                        Life Insurance (RM) - Limited to RM 3,000
                      </Label>
                      <Input
                        id="lifeInsurance"
                        type="number"
                        value={lifeInsurance}
                        onChange={(e) => setLifeInsurance(Math.min(Number(e.target.value), 3000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="education" className="space-y-4">
                    <div>
                      <Label htmlFor="eduSelf" className="text-sm font-medium">
                        Education Fees (RM) - Limited to RM 7,000
                      </Label>
                      <Input
                        id="eduSelf"
                        type="number"
                        value={eduSelf}
                        onChange={(e) => setEduSelf(Math.min(Number(e.target.value), 7000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="prs" className="text-sm font-medium">
                        Annuity / PRS (RM) - Limited to RM 4,000
                      </Label>
                      <Input
                        id="prs"
                        type="number"
                        value={prs}
                        onChange={(e) => setPrs(Math.min(Number(e.target.value), 4000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="other" className="space-y-4">
                    <div>
                      <Label htmlFor="epf" className="text-sm font-medium">
                        EPF / KWSP (RM) - Limited to RM 4,000
                      </Label>
                      <Input
                        id="epf"
                        type="number"
                        value={epf}
                        onChange={(e) => setEpf(Math.min(Number(e.target.value), 4000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="supportEquip" className="text-sm font-medium">
                        Supporting Equipment (RM) - Limited to RM 6,000
                      </Label>
                      <Input
                        id="supportEquip"
                        type="number"
                        value={supportEquip}
                        onChange={(e) => setSupportEquip(Math.min(Number(e.target.value), 6000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lifestyle" className="text-sm font-medium">
                        Lifestyle (Books, Sports, etc.) (RM) - Limited to RM 2,500
                      </Label>
                      <Input
                        id="lifestyle"
                        type="number"
                        value={lifestyle}
                        onChange={(e) => setLifestyle(Math.min(Number(e.target.value), 2500))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sportEquip" className="text-sm font-medium">
                        Sport Equipment (RM) - Limited to RM 500
                      </Label>
                      <Input
                        id="sportEquip"
                        type="number"
                        value={sportEquip}
                        onChange={(e) => setSportEquip(Math.min(Number(e.target.value), 500))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="socso" className="text-sm font-medium">
                        SOCSO / PERKESO (RM) - Limited to RM 350
                      </Label>
                      <Input
                        id="socso"
                        type="number"
                        value={socso}
                        onChange={(e) => setSocso(Math.min(Number(e.target.value), 350))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ev" className="text-sm font-medium">
                        EV Charging Facilities (RM) - Limited to RM 10,000
                      </Label>
                      <Input
                        id="ev"
                        type="number"
                        value={ev}
                        onChange={(e) => setEv(Math.min(Number(e.target.value), 10000))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zakat" className="text-sm font-medium">
                        Zakat (RM) - Unlimited
                      </Label>
                      <Input
                        id="zakat"
                        type="number"
                        value={zakat}
                        onChange={(e) => setZakat(Number(e.target.value))}
                        className="mt-2"
                        placeholder="0"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Summary Card */}
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 shadow-xl">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Tax Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="pb-4 border-b border-border">
                      <p className="text-sm text-muted-foreground mb-1">Gross Income</p>
                      <p className="text-2xl font-bold text-foreground">
                        RM {calculation.grossIncome.toLocaleString()}
                      </p>
                    </div>

                    <div className="pb-4 border-b border-border">
                      <p className="text-sm text-muted-foreground mb-1">Total Deductions</p>
                      <p className="text-2xl font-bold text-secondary">
                        -RM {calculation.totalDeductions.toLocaleString()}
                      </p>
                    </div>

                    <div className="pb-4 border-b border-border">
                      <p className="text-sm text-muted-foreground mb-1">Taxable Income</p>
                      <p className="text-2xl font-bold text-foreground">
                        RM {calculation.taxableIncome.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-4 bg-white rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Tax Payable</p>
                      <p className="text-4xl font-bold text-primary mb-2">
                        RM {calculation.taxAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Average Rate: {calculation.averageTaxRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Tax Breakdown */}
                <Card className="p-6 border-border shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Tax Breakdown</h3>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {calculation.taxByBracket.length > 0 ? (
                      calculation.taxByBracket.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">{item.bracket}</p>
                            <p className="text-sm font-medium text-foreground">{item.rate}%</p>
                          </div>
                          <p className="font-semibold text-primary">
                            RM {item.amount.toFixed(2)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No tax applicable
                      </p>
                    )}
                  </div>
                </Card>

                {/* Download Button */}
                <Button 
                  onClick={handleDownloadSummary}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border mt-16 py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">About Mudahcukai</h4>
              <p className="text-sm text-muted-foreground">
                A transparent, accurate income tax calculator based on LHDN Malaysia's official tax brackets and reliefs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Disclaimer</h4>
              <p className="text-sm text-muted-foreground">
                This calculator is for informational purposes only. Please verify with official LHDN sources before tax submission.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <a 
                href="https://www.hasil.gov.my" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block"
              >
                LHDN Malaysia Official Website
              </a>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Mudahcukai. All rights reserved. Year of Assessment: 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
