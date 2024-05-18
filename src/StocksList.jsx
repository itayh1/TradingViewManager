import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";

function removeStockExchangeFromTicker(stockName) {
  const index = stockName.indexOf(":");
  if (index !== -1) {
    return stockName.slice(index + 1);
  } else {
    return stockName;
  }
}

function StocksList({ currentStocks, onDeleteStock }) {
  const currentStocksCleaned = currentStocks.map(removeStockExchangeFromTicker);
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        {currentStocksCleaned.map((stock) => (
          <div key={stock}>
            <div className="text-sm flex flex-row justify-between">
              {stock}
              <Button variant="ghost" onClick={() => onDeleteStock(stock)}>
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export { removeStockExchangeFromTicker };
export default StocksList;
