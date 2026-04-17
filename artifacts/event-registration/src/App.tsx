import { Router as WouterRouter, Switch, Route } from "wouter";
import PurchaseOrderForm from "@/pages/PurchaseOrderForm";
import AdminOrders from "@/pages/AdminOrders";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PurchaseOrderForm} />
      <Route path="/admin" component={AdminOrders} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
