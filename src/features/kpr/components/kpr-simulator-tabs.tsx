"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPR_TERMS } from "../terms";
import { KprCalculator } from "./kpr-calculator";

interface KprSimulatorTabsProps {
  price: number;
  projectName: string;
  unitName: string;
}

/** Halaman simulasi: tab KPR konvensional dan KPR syariah. */
export function KprSimulatorTabs({ price, projectName, unitName }: KprSimulatorTabsProps) {
  return (
    <Tabs defaultValue="konvensional" className="gap-6">
      <TabsList className="h-11 w-full sm:w-auto">
        <TabsTrigger value="konvensional" className="flex-1 sm:flex-none">
          {KPR_TERMS.konvensional.title}
        </TabsTrigger>
        <TabsTrigger value="syariah" className="flex-1 sm:flex-none">
          {KPR_TERMS.syariah.title}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="konvensional">
        <KprCalculator
          scheme="konvensional"
          price={price}
          projectName={projectName}
          unitName={unitName}
        />
      </TabsContent>
      <TabsContent value="syariah">
        <KprCalculator
          scheme="syariah"
          price={price}
          projectName={projectName}
          unitName={unitName}
        />
      </TabsContent>
    </Tabs>
  );
}
