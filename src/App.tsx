"use client";

import type { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "@/router/nextCompat";

import AdminLayout from "@/components/admin/AdminLayout";
import Layout from "@/components/layout/Layout";
import V1Stylesheets from "@/components/styles/V1Stylesheets";

import PrivateRoute from "@/routes/PrivateRoute";
import RoleRoute from "@/routes/RoleRoute";

import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import ProductDetails from "@/pages/ProductDetails";
import Products from "@/pages/Products";

import AccountDetails from "@/pages/account/AccountDetails";
import AddPaymentMethod from "@/pages/account/AddPaymentMethod";
import ChangePassword from "@/pages/account/ChangePassword";
import Connections from "@/pages/account/Connections";
import Enable2FA from "@/pages/account/Enable2FA";
import MyAccount from "@/pages/account/MyAccount";
import PaymentMethods from "@/pages/account/PaymentMethods";
import AccountPrivacy from "@/pages/account/Privacy";
import AccountSecurity from "@/pages/account/Security";
import AccountSettings from "@/pages/account/Settings";
import TransactionHistory from "@/pages/account/TransactionHistory";

import AdminDatabase from "@/pages/admin/database/Database";

import CreateItem from "@/pages/admin/items/CreateItem";
import DeleteItem from "@/pages/admin/items/DeleteItem";
import EditItem from "@/pages/admin/items/EditItem";
import ItemDetails from "@/pages/admin/items/ItemDetails";

import CreatePage from "@/pages/admin/page-builder/CreatePage";
import DeletePage from "@/pages/admin/page-builder/DeletePage";

import CreateProduct from "@/pages/admin/products/CreateProduct";
import EditProduct from "@/pages/admin/products/EditProduct";

import CreatePromoCode from "@/pages/admin/promo-codes/CreatePromoCode";
import PromoCodes from "@/pages/admin/promo-codes/PromoCodes";

import CreateSpell from "@/pages/admin/spells/CreateSpell";
import DeleteSpell from "@/pages/admin/spells/DeleteSpell";
import EditSpell from "@/pages/admin/spells/EditSpell";
import SpellDetails from "@/pages/admin/spells/SpellDetails";

import Login from "@/pages/auth/Login";
import LoginWith2FA from "@/pages/auth/LoginWith2FA";
import RecoveryCodeLogin from "@/pages/auth/RecoveryCodeLogin";
import Register from "@/pages/auth/Register";
import ShowRecoveryCodes from "@/pages/auth/ShowRecoveryCodes";
import VerifyEmail from "@/pages/auth/VerifyEmail";

import AddProduct from "@/pages/cart/AddProduct";
import CartArchive from "@/pages/cart/CartArchive";
import CartDetails from "@/pages/cart/CartDetails";

import CardPayment from "@/pages/checkout/CardPayment";
import CheckoutFailure from "@/pages/checkout/Failure";
import CheckoutPayment from "@/pages/checkout/Payment";
import RegisteredCheckout from "@/pages/checkout/Registered";
import CheckoutReview from "@/pages/checkout/Review";
import Shipping from "@/pages/checkout/Shipping";
import CheckoutSuccess from "@/pages/checkout/Success";
import ThanksForPurchasing from "@/pages/checkout/ThanksForPurchasing";

import ContentPage from "@/pages/content/ContentPage";
import SitePrivacy from "@/pages/content/Privacy";

import CreateDiscussion from "@/pages/discussions/CreateDiscussion";
import DiscussionDetails from "@/pages/discussions/DiscussionDetails";
import Discussions from "@/pages/discussions/Discussions";

import ErrorPage from "@/pages/errors/ErrorPage";
import ServerError from "@/pages/errors/ServerError";

import HolyConsumables from "@/pages/guides/holy/Consumables";
import HolyGear from "@/pages/guides/holy/Gear";
import HolyOverview from "@/pages/guides/holy/Overview";
import HolyRotation from "@/pages/guides/holy/Rotation";
import HolyStats from "@/pages/guides/holy/Stats";
import HolyTalents from "@/pages/guides/holy/Talents";

import ProtectionConsumables from "@/pages/guides/protection/Consumables";
import ProtectionGear from "@/pages/guides/protection/Gear";
import ProtectionOverview from "@/pages/guides/protection/Overview";
import ProtectionRotation from "@/pages/guides/protection/Rotation";
import ProtectionStats from "@/pages/guides/protection/Stats";
import ProtectionTalents from "@/pages/guides/protection/Talents";

import RetributionConsumables from "@/pages/guides/retribution/Consumables";
import RetributionGear from "@/pages/guides/retribution/Gear";
import RetributionOverview from "@/pages/guides/retribution/Overview";
import RetributionRotation from "@/pages/guides/retribution/Rotation";
import RetributionStats from "@/pages/guides/retribution/Stats";
import RetributionTalents from "@/pages/guides/retribution/Talents";

function protectedPage(page: ReactNode) {
  return <PrivateRoute>{page}</PrivateRoute>;
}

export default function App() {
  return (
    <Router>
      <V1Stylesheets />

      <Routes>
        <Route element={<Layout />}>
          {/* HOME */}
          <Route path="/" element={<Home />} />
          <Route path="/Home/Home" element={<Home />} />

          {/* HOLY */}
          <Route path="/Holy/Overview" element={<HolyOverview />} />
          <Route path="/Holy/Gear" element={<HolyGear />} />
          <Route path="/Holy/Talents" element={<HolyTalents />} />
          <Route path="/Holy/Consumables" element={<HolyConsumables />} />
          <Route path="/Holy/Rotation" element={<HolyRotation />} />
          <Route path="/Holy/Stats" element={<HolyStats />} />

          {/* PROTECTION */}
          <Route
            path="/Protection/Overview"
            element={<ProtectionOverview />}
          />
          <Route path="/Protection/Gear" element={<ProtectionGear />} />
          <Route
            path="/Protection/Talents"
            element={<ProtectionTalents />}
          />
          <Route
            path="/Protection/Consumables"
            element={<ProtectionConsumables />}
          />
          <Route
            path="/Protection/Rotation"
            element={<ProtectionRotation />}
          />
          <Route path="/Protection/Stats" element={<ProtectionStats />} />

          {/* RETRIBUTION */}
          <Route
            path="/Retribution/Overview"
            element={<RetributionOverview />}
          />
          <Route path="/Retribution/Gear" element={<RetributionGear />} />
          <Route
            path="/Retribution/Talents"
            element={<RetributionTalents />}
          />
          <Route
            path="/Retribution/Consumables"
            element={<RetributionConsumables />}
          />
          <Route
            path="/Retribution/Rotation"
            element={<RetributionRotation />}
          />
          <Route
            path="/Retribution/Stats"
            element={<RetributionStats />}
          />

          {/* DISCUSSIONS */}
          <Route path="/Discussions/Index" element={<Discussions />} />
          <Route path="/discussions" element={<Discussions />} />

          <Route
            path="/Discussions/Create"
            element={<CreateDiscussion />}
          />

          <Route
            path="/Discussions/Details/:id"
            element={<DiscussionDetails />}
          />

          {/* PRODUCTS */}
          <Route
            path="/Merchandise/Merchandise"
            element={<Products />}
          />

          <Route
            path="/Merchandise/List"
            element={<Products />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/Products/Details/:id"
            element={<ProductDetails />}
          />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          {/* CART */}
          <Route path="/Cart/MyCart" element={<Cart />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/Cart/Details/:id" element={<CartDetails />} />
          <Route path="/Cart/Archive" element={<CartArchive />} />
          <Route path="/Products/Add/:id" element={<AddProduct />} />

          {/* CHECKOUT */}
          <Route path="/Checkout/Start" element={<Checkout />} />
          <Route path="/checkout" element={<Checkout />} />

          <Route
            path="/Checkout/Shipping"
            element={<Shipping />}
          />

          <Route
            path="/Checkout/Payment"
            element={<CheckoutPayment />}
          />

          <Route
            path="/Checkout/Card"
            element={<CardPayment />}
          />

          <Route
            path="/Checkout/Review"
            element={<CheckoutReview />}
          />

          <Route
            path="/Checkout/Registered"
            element={<RegisteredCheckout />}
          />

          <Route
            path="/Checkout/Success"
            element={<CheckoutSuccess />}
          />

          <Route
            path="/Checkout/Failure"
            element={<CheckoutFailure />}
          />

          <Route
            path="/Home/ThanksForPurchasing"
            element={<ThanksForPurchasing />}
          />

          {/* AUTH */}
          <Route path="/Account/Login" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route path="/Account/Register" element={<Register />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/Account/LoginWith2fa"
            element={<LoginWith2FA />}
          />

          <Route
            path="/Account/RecoveryCodeLogin"
            element={<RecoveryCodeLogin />}
          />

          <Route
            path="/Account/VerifyEmail"
            element={<VerifyEmail />}
          />

          {/* ACCOUNT */}
          <Route
            path="/Account/ShowRecoveryCodes"
            element={protectedPage(<ShowRecoveryCodes />)}
          />

          <Route
            path="/Account/MyAccount"
            element={protectedPage(<MyAccount />)}
          />

          <Route
            path="/account"
            element={protectedPage(<MyAccount />)}
          />

          <Route
            path="/Account/AccountDetails"
            element={protectedPage(<AccountDetails />)}
          />

          <Route
            path="/Account/ChangePassword"
            element={protectedPage(<ChangePassword />)}
          />

          <Route
            path="/Account/Connections"
            element={protectedPage(<Connections />)}
          />

          <Route
            path="/Account/Enable2FA"
            element={protectedPage(<Enable2FA />)}
          />

          <Route
            path="/Account/PaymentMethods"
            element={protectedPage(<PaymentMethods />)}
          />

          <Route
            path="/Account/AddPaymentMethod"
            element={protectedPage(<AddPaymentMethod />)}
          />

          <Route
            path="/Account/Privacy"
            element={protectedPage(<AccountPrivacy />)}
          />

          <Route
            path="/Account/Security"
            element={protectedPage(<AccountSecurity />)}
          />

          <Route
            path="/Account/Settings"
            element={protectedPage(<AccountSettings />)}
          />

          <Route
            path="/Account/TransactionHistory"
            element={protectedPage(<TransactionHistory />)}
          />

          {/* PRIVACY */}
          <Route path="/Home/Privacy" element={<SitePrivacy />} />
          <Route path="/privacy" element={<SitePrivacy />} />

          {/* ERRORS */}
          <Route path="/Error/404" element={<NotFound />} />
          <Route path="/Error/500" element={<ServerError />} />
          <Route path="/error" element={<ErrorPage />} />

          {/* ADMIN */}
          <Route
            path="/Admin"
            element={
              <RoleRoute role="Admin">
                <AdminLayout />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDatabase />} />
            <Route path="Database" element={<AdminDatabase />} />

            <Route path="Items/Create" element={<CreateItem />} />
            <Route path="Items/Edit/:id" element={<EditItem />} />
            <Route path="Items/Details/:id" element={<ItemDetails />} />
            <Route path="Items/Delete/:id" element={<DeleteItem />} />

            <Route path="Spells/Create" element={<CreateSpell />} />
            <Route path="Spells/Edit/:id" element={<EditSpell />} />
            <Route path="Spells/Details/:id" element={<SpellDetails />} />
            <Route path="Spells/Delete/:id" element={<DeleteSpell />} />

            <Route
              path="PageBuilder/Create"
              element={<CreatePage />}
            />

            <Route
              path="PageBuilder/DeleteConfirm"
              element={<DeletePage />}
            />

            <Route
              path="Products/Create"
              element={<CreateProduct />}
            />

            <Route
              path="Products/Edit/:id"
              element={<EditProduct />}
            />

            <Route
              path="PromoCodes"
              element={<PromoCodes />}
            />

            <Route
              path="PromoCodes/Create"
              element={<CreatePromoCode />}
            />
          </Route>

          {/* DYNAMIC CONTENT PAGE */}
          <Route
            path="/:section/:slug"
            element={<ContentPage />}
          />

          {/* FALLBACK */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}