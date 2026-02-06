/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AdminFAQ from './pages/AdminFAQ';
import AdminMessagesStats from './pages/AdminMessagesStats';
import AdminPayments from './pages/AdminPayments';
import AdminTickets from './pages/AdminTickets';
import Autonomo from './pages/Autonomo';
import CRM from './pages/CRM';
import CRMAutomations from './pages/CRMAutomations';
import Calendar from './pages/Calendar';
import Categoria from './pages/Categoria';
import ClientDetail from './pages/ClientDetail';
import ClientOnboarding from './pages/ClientOnboarding';
import CookiePolicy from './pages/CookiePolicy';
import DashboardProInfo from './pages/DashboardProInfo';
import FAQ from './pages/FAQ';
import FAQDetail from './pages/FAQDetail';
import Favorites from './pages/Favorites';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import Jobs from './pages/Jobs';
import LegalNotice from './pages/LegalNotice';
import Messages from './pages/Messages';
import MyProfile from './pages/MyProfile';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import PayInvoice from './pages/PayInvoice';
import PaymentSuccess from './pages/PaymentSuccess';
import Presupuestos from './pages/Presupuestos';
import PricingPlans from './pages/PricingPlans';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import ProfessionalProfile from './pages/ProfessionalProfile';
import ProfileOnboarding from './pages/ProfileOnboarding';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import QuoteRequests from './pages/QuoteRequests';
import RequestQuote from './pages/RequestQuote';
import Search from './pages/Search';
import SubscriptionManagement from './pages/SubscriptionManagement';
import TermsConditions from './pages/TermsConditions';
import TicketDetail from './pages/TicketDetail';
import Tickets from './pages/Tickets';
import UserTypeSelection from './pages/UserTypeSelection';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminFAQ": AdminFAQ,
    "AdminMessagesStats": AdminMessagesStats,
    "AdminPayments": AdminPayments,
    "AdminTickets": AdminTickets,
    "Autonomo": Autonomo,
    "CRM": CRM,
    "CRMAutomations": CRMAutomations,
    "Calendar": Calendar,
    "Categoria": Categoria,
    "ClientDetail": ClientDetail,
    "ClientOnboarding": ClientOnboarding,
    "CookiePolicy": CookiePolicy,
    "DashboardProInfo": DashboardProInfo,
    "FAQ": FAQ,
    "FAQDetail": FAQDetail,
    "Favorites": Favorites,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "Invoices": Invoices,
    "Jobs": Jobs,
    "LegalNotice": LegalNotice,
    "Messages": Messages,
    "MyProfile": MyProfile,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "PayInvoice": PayInvoice,
    "PaymentSuccess": PaymentSuccess,
    "Presupuestos": Presupuestos,
    "PricingPlans": PricingPlans,
    "PrivacyPolicy": PrivacyPolicy,
    "ProfessionalDashboard": ProfessionalDashboard,
    "ProfessionalProfile": ProfessionalProfile,
    "ProfileOnboarding": ProfileOnboarding,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "QuoteRequests": QuoteRequests,
    "RequestQuote": RequestQuote,
    "Search": Search,
    "SubscriptionManagement": SubscriptionManagement,
    "TermsConditions": TermsConditions,
    "TicketDetail": TicketDetail,
    "Tickets": Tickets,
    "UserTypeSelection": UserTypeSelection,
}

export const pagesConfig = {
    mainPage: "Search",
    Pages: PAGES,
    Layout: __Layout,
};