// ──────────────────────────────────────────────
// API Router — Mounts All Resource Routers
// ──────────────────────────────────────────────

import { Router } from "express";
import { userRouter } from "./user.routes.js";
import { orderRouter } from "./order.routes.js";
import { categoryRouter } from "./category.routes.js";
import { productRouter } from "./product.routes.js";
import { customerRouter } from "./customer.routes.js";
import { billRouter } from "./bill.routes.js";
import { supplierRouter, purchaseRouter } from "./supplier.routes.js";
import { inventoryRouter } from "./inventory.routes.js";
import { settingRouter } from "./setting.routes.js";

export const apiRouter = Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/customers", customerRouter);
apiRouter.use("/bills", billRouter);
apiRouter.use("/suppliers", supplierRouter);
apiRouter.use("/purchases", purchaseRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/settings", settingRouter);
