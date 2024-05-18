import { useEffect, useState } from "react";
import "./App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import StocksList from "./StocksList";
import currentStocksExample from "./stocksExample";

async function parseTickerFile(filename) {
  const resp = await fetch(`/${filename}`);
  if (!resp.ok) {
    throw new Error("Could not open file");
  }
  const text = await resp.text();
  const list = JSON.parse(text);
  return list;
}
async function getAllTickers() {
  try {
    const nasdaqTickers = await parseTickerFile("nasdaq_tickers.json");
    const nyseTickers = await parseTickerFile("nyse_tickers.json");
    const amexTickers = await parseTickerFile("amex_tickers.json");
    return { nasdaqTickers, nyseTickers, amexTickers };
  } catch (error) {
    console.log(error);
    return null;
  }
}
async function getCurrentStocks(updateValue) {
  if (!chrome.tabs) {
    updateValue(currentStocksExample);
    return;
  }
  let [tab] = await chrome.tabs.query({ active: true });
  await chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => {
        const obj = JSON.parse(localStorage.getItem("deleted_symbols_list"))[
          "symbols"
        ];
        return obj;
      },
    },
    function (resultsArray) {
      const res = resultsArray[0].result;
      // console.log(res);
      updateValue(res);
    }
  );
}
async function saveCurrentSymbols(currentSymbolsList) {
  if (!chrome.tabs) {
    alert("You're not run as extension");
    return;
  }
  let [tab] = await chrome.tabs.query({ active: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (stocksList) => {
      console.log(stocksList);
      obj = JSON.parse(localStorage.getItem("deleted_symbols_list"));
      obj["symbols"] = stocksList;
      localStorage.setItem("deleted_symbols_list", JSON.stringify(obj));
    },
    args: [currentSymbolsList],
  });
}
function App() {
  const [newStock, setNewStock] = useState("");
  const [currentStocks, setCurrentStocks] = useState(null);
  const [allStocks, setAllStocks] = useState({
    nyseStocks: [],
    nasdaqStocks: [],
    amexStocks: [],
  });
  useEffect(() => {
    const asyncFunc = async () => {
      const allTickers = await getAllTickers();
      setAllStocks({
        amexStocks: allTickers.amexTickers,
        nasdaqStocks: allTickers.nasdaqTickers,
        nyseStocks: allTickers.nyseTickers,
      });
    };
    asyncFunc();
  }, []);
  const loadCurrentStocks = () => {
    const updateCurrentStocksCallback = (stocksList) => {
      // const cleanedStocksList = stocksList.map(removeStockExchangeFromTicker);
      setCurrentStocks(stocksList);
    };
    getCurrentStocks(updateCurrentStocksCallback);
  };
  const addStockToList = () => {
    if (currentStocks.indexOf(newStock) >= 0) return;

    if (
      allStocks.amexStocks.indexOf(newStock) === -1 &&
      allStocks.nasdaqStocks.indexOf(newStock) === -1 &&
      allStocks.nyseStocks.indexOf(newStock) === -1
    ) {
      alert(`${newStock} is not a stock`);
      return;
    }
    setCurrentStocks((prevStock) => [...prevStock, newStock]);
    setNewStock("");
  };
  const saveListOfStocksToLocalStore = () => {
    const stocksWithTickers = currentStocks.map((stock) => {
      if (stock.indexOf(":") !== -1) return stock;
      if (allStocks.nasdaqStocks.indexOf(stock) >= 0) return "NASDAQ:" + stock;
      if (allStocks.nyseStocks.indexOf(stock) >= 0) return "NYSE:" + stock;
      if (allStocks.amexStocks.indexOf(stock) >= 0) return "AMEX:" + stock;
      alert(`stock ${stock} is not in ticker of any broker`);
      throw Error(`stock ${stock} is not in ticker of any broker`);
    });
    saveCurrentSymbols(stocksWithTickers);
    alert('Saved list successfully');
  };
  const onDeleteStock = (stockToDelete) => {
    setCurrentStocks(prevStockList => prevStockList.filter(stock => {
      const idx = stock.indexOf(":");
      if (idx === -1) {
        return stock !== stockToDelete;
      } else {
        return stock.slice(idx + 1) !== stockToDelete;
      }
    }))
  }

  return (
    <>
      <Label >TradingView Stocks manager</Label>

      <Input
        type="text"
        value={newStock}
        onChange={(e) => setNewStock(e.target.value)}
      />
      <Button onClick={() => addStockToList()}>Add stock to list</Button>
      <Button onClick={() => saveListOfStocksToLocalStore()}>Save list</Button>
      {currentStocks && <StocksList currentStocks={currentStocks}  onDeleteStock={onDeleteStock} />}
      <div className="card">
        <br />
        <button onClick={loadCurrentStocks}>Load stocks from TV</button>
      </div>
    </>
  );
}

export default App;
