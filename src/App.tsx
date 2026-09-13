"use client";

import type { ReactNode } from "react";
import { BrowserRouter as Router, Route, Routes } from "@/router/nextCompat";

import { LocalizationProvider } from "@/localization/LocalizationContext";
import { adminPermissions } from "@/auth/adminPermissions";
import AdminTranslations from "@/pages/admin/translations/Translations";
import FooterAdmin from "@/pages/admin/footer/FooterAdmin";
import BannersAdmin from "@/pages/admin/banners/Banners";
import AdminSeo from "@/pages/admin/seo/Seo";
import AdminLayout from "@/components/admin/AdminLayout";
import Layout from "@/components/layout/Layout";
import V1Stylesheets from "@/components/styles/V1Stylesheets";

import PrivateRoute from "@/routes/PrivateRoute";
import PermissionRoute from "@/routes/PermissionRoute";

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
import AdminCategories from "@/pages/admin/categories/Categories";
import AdminClasses from "@/pages/admin/classes/Classes";
import PageHistory from "@/pages/admin/page-builder/PageHistory";
import AdminNavigation from "@/pages/admin/navigation/Navigation";
import AdminMedia from "@/pages/admin/media/Media";
import AdminRarities from "@/pages/admin/rarities/Rarities";
import AdminPatches from "@/pages/admin/patches/Patches";
import AdminTags from "@/pages/admin/tags/Tags";
import CreateItem from "@/pages/admin/items/CreateItem";
import DeleteItem from "@/pages/admin/items/DeleteItem";
import EditItem from "@/pages/admin/items/EditItem";
import ItemDetails from "@/pages/admin/items/ItemDetails";
import PageBuilderIndex from "@/pages/admin/page-builder/PageBuilderIndex";
import TalentTreesBuilder from "@/pages/admin/page-builder/TalentTrees";
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
import AdminHome from "@/pages/admin/access/AdminHome";
import RolesAdmin from "@/pages/admin/access/Roles";
import UsersAdmin from "@/pages/admin/access/Users";

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
import Forbidden from "@/pages/errors/Forbidden";
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

function permissionPage(page: ReactNode, permission: string) {
  return <PermissionRoute permission={permission}>{page}</PermissionRoute>;
}

function adminShell(page: ReactNode) {
  return <PermissionRoute allowAnyAdminPermission>{page}</PermissionRoute>;
}

export default function App() {
  return (
    <Router><LocalizationProvider>
      <V1Stylesheets />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/Home/Home" element={<Home />} />

          <Route path="/Holy/Overview" element={<HolyOverview />} />
          <Route path="/Holy/Gear" element={<HolyGear />} />
          <Route path="/Holy/Talents" element={<HolyTalents />} />
          <Route path="/Holy/Consumables" element={<HolyConsumables />} />
          <Route path="/Holy/Rotation" element={<HolyRotation />} />
          <Route path="/Holy/Stats" element={<HolyStats />} />

          <Route path="/Protection/Overview" element={<ProtectionOverview />} />
          <Route path="/Protection/Gear" element={<ProtectionGear />} />
          <Route path="/Protection/Talents" element={<ProtectionTalents />} />
          <Route path="/Protection/Consumables" element={<ProtectionConsumables />} />
          <Route path="/Protection/Rotation" element={<ProtectionRotation />} />
          <Route path="/Protection/Stats" element={<ProtectionStats />} />

          <Route path="/Retribution/Overview" element={<RetributionOverview />} />
          <Route path="/Retribution/Gear" element={<RetributionGear />} />
          <Route path="/Retribution/Talents" element={<RetributionTalents />} />
          <Route path="/Retribution/Consumables" element={<RetributionConsumables />} />
          <Route path="/Retribution/Rotation" element={<RetributionRotation />} />
          <Route path="/Retribution/Stats" element={<RetributionStats />} />

          <Route path="/Discussion/Index" element={<Discussions />} />
          <Route path="/Discussions/Index" element={<Discussions />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/Discussions/Create" element={<CreateDiscussion />} />
          <Route path="/Discussions/Details/:id" element={<DiscussionDetails />} />

          <Route path="/Merchandise/Merchandise" element={<Products />} />
          <Route path="/Merchandise/List" element={<Products />} />
          <Route path="/products" element={<Products />} />
          <Route path="/Products/Details/:id" element={<ProductDetails />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/Products/Create" element={permissionPage(<AdminLayout><CreateProduct /></AdminLayout>, adminPermissions.products.create)} />
          <Route path="/Products/Edit/:id" element={permissionPage(<AdminLayout><EditProduct /></AdminLayout>, adminPermissions.products.update)} />

          <Route path="/Cart/MyCart" element={<Cart />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/Cart/Details/:id" element={<CartDetails />} />
          <Route path="/Cart/Archive" element={permissionPage(<CartArchive />, adminPermissions.carts.read)} />
          <Route path="/Products/Add/:id" element={<AddProduct />} />

          <Route path="/Checkout/Start" element={<Checkout />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/Checkout/Shipping" element={<Shipping />} />
          <Route path="/Checkout/Payment" element={<CheckoutPayment />} />
          <Route path="/Checkout/Card" element={<CardPayment />} />
          <Route path="/Checkout/Review" element={<CheckoutReview />} />
          <Route path="/Checkout/Registered" element={<RegisteredCheckout />} />
          <Route path="/Checkout/Success" element={<CheckoutSuccess />} />
          <Route path="/Checkout/Failure" element={<CheckoutFailure />} />
          <Route path="/Home/ThanksForPurchasing" element={<ThanksForPurchasing />} />

          <Route path="/Account/Login" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Account/Register" element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/Account/LoginWith2fa" element={<LoginWith2FA />} />
          <Route path="/Account/RecoveryCodeLogin" element={<RecoveryCodeLogin />} />
          <Route path="/Account/VerifyEmail" element={<VerifyEmail />} />

          <Route path="/Account/ShowRecoveryCodes" element={protectedPage(<ShowRecoveryCodes />)} />
          <Route path="/Account/MyAccount" element={protectedPage(<MyAccount />)} />
          <Route path="/account" element={protectedPage(<MyAccount />)} />
          <Route path="/Account/AccountDetails" element={protectedPage(<AccountDetails />)} />
          <Route path="/Account/ChangePassword" element={protectedPage(<ChangePassword />)} />
          <Route path="/Account/Connections" element={protectedPage(<Connections />)} />
          <Route path="/Account/Enable2FA" element={protectedPage(<Enable2FA />)} />
          <Route path="/Account/PaymentMethods" element={protectedPage(<PaymentMethods />)} />
          <Route path="/Account/AddPaymentMethod" element={protectedPage(<AddPaymentMethod />)} />
          <Route path="/Account/Privacy" element={protectedPage(<AccountPrivacy />)} />
          <Route path="/Account/Security" element={protectedPage(<AccountSecurity />)} />
          <Route path="/Account/Settings" element={protectedPage(<AccountSettings />)} />
          <Route path="/Account/TransactionHistory" element={protectedPage(<TransactionHistory />)} />

          <Route path="/Home/Privacy" element={<SitePrivacy />} />
          <Route path="/privacy" element={<SitePrivacy />} />
          <Route path="/Error/403" element={<Forbidden />} />
          <Route path="/Error/404" element={<NotFound />} />
          <Route path="/Error/500" element={<ServerError />} />
          <Route path="/error" element={<ErrorPage />} />

          <Route path="/Admin" element={adminShell(<AdminLayout />)}>
            <Route index element={<AdminHome />} />
            <Route path="Database" element={permissionPage(<AdminDatabase />, adminPermissions.database.read)} />
            <Route path="Categories" element={permissionPage(<AdminCategories />, adminPermissions.categories.read)} />
            <Route path="Classes" element={permissionPage(<AdminClasses />, adminPermissions.classes.read)} />
            <Route path="PageBuilder/History" element={permissionPage(<PageHistory />, adminPermissions.pages.read)} />
            <Route path="Footer" element={permissionPage(<FooterAdmin />, adminPermissions.footer.read)} />
            <Route path="Banners" element={permissionPage(<BannersAdmin />, adminPermissions.banners.read)} />
            <Route path="Translations" element={permissionPage(<AdminTranslations />, adminPermissions.localization.read)} />
            <Route path="Navigation" element={permissionPage(<AdminNavigation />, adminPermissions.navigation.read)} />
            <Route path="Media" element={permissionPage(<AdminMedia />, adminPermissions.media.read)} />
            <Route path="Seo" element={permissionPage(<AdminSeo />, adminPermissions.seo.read)} />
            <Route path="Rarities" element={permissionPage(<AdminRarities />, adminPermissions.rarities.read)} />
            <Route path="Patches" element={permissionPage(<AdminPatches />, adminPermissions.patches.read)} />
            <Route path="Tags" element={permissionPage(<AdminTags />, adminPermissions.tags.read)} />
            <Route path="Database/Index" element={permissionPage(<AdminDatabase />, adminPermissions.database.read)} />
            <Route path="Roles" element={permissionPage(<RolesAdmin />, adminPermissions.roles.read)} />
            <Route path="Users" element={permissionPage(<UsersAdmin />, adminPermissions.users.read)} />

            <Route path="Items/Create" element={permissionPage(<CreateItem />, adminPermissions.items.create)} />
            <Route path="Items/Edit/:id" element={permissionPage(<EditItem />, adminPermissions.items.update)} />
            <Route path="Items/Details/:id" element={permissionPage(<ItemDetails />, adminPermissions.items.read)} />
            <Route path="Items/Delete/:id" element={permissionPage(<DeleteItem />, adminPermissions.items.delete)} />

            <Route path="Spells/Create" element={permissionPage(<CreateSpell />, adminPermissions.spells.create)} />
            <Route path="Spells/Edit/:id" element={permissionPage(<EditSpell />, adminPermissions.spells.update)} />
            <Route path="Spells/Details/:id" element={permissionPage(<SpellDetails />, adminPermissions.spells.read)} />
            <Route path="Spells/Delete/:id" element={permissionPage(<DeleteSpell />, adminPermissions.spells.delete)} />

            <Route path="PageBuilder" element={permissionPage(<PageBuilderIndex />, adminPermissions.pages.read)} />
            <Route path="PageBuilder/Index" element={permissionPage(<PageBuilderIndex />, adminPermissions.pages.read)} />
            <Route path="PageBuilder/TalentTrees" element={permissionPage(<TalentTreesBuilder />, adminPermissions.talentTrees.read)} />
            <Route path="PageBuilder/Create" element={permissionPage(<CreatePage />, adminPermissions.pages.create)} />
            <Route path="PageBuilder/Edit" element={permissionPage(<CreatePage />, adminPermissions.pages.update)} />
            <Route path="PageBuilder/DeleteConfirm" element={permissionPage(<DeletePage />, adminPermissions.pages.delete)} />
            <Route path="PageBuilder/Delete" element={permissionPage(<DeletePage />, adminPermissions.pages.delete)} />

            <Route path="Products/Create" element={permissionPage(<CreateProduct />, adminPermissions.products.create)} />
            <Route path="Products/Edit/:id" element={permissionPage(<EditProduct />, adminPermissions.products.update)} />

            <Route path="PromoCodes" element={permissionPage(<PromoCodes />, adminPermissions.promoCodes.read)} />
            <Route path="PromoCodes/Index" element={permissionPage(<PromoCodes />, adminPermissions.promoCodes.read)} />
            <Route path="PromoCodes/Create" element={permissionPage(<CreatePromoCode />, adminPermissions.promoCodes.create)} />
          </Route>

          <Route path="/:section/:slug" element={<ContentPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </LocalizationProvider></Router>
  );
}
