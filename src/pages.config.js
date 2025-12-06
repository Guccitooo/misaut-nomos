import Search from './pages/Search';
import ProfessionalProfile from './pages/ProfessionalProfile';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import MyProfile from './pages/MyProfile';
import AdminDashboard from './pages/AdminDashboard';
import Onboarding from './pages/Onboarding';
import PricingPlans from './pages/PricingPlans';
import ProfileOnboarding from './pages/ProfileOnboarding';
import SubscriptionManagement from './pages/SubscriptionManagement';
import UserTypeSelection from './pages/UserTypeSelection';
import ClientOnboarding from './pages/ClientOnboarding';
import HelpCenter from './pages/HelpCenter';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import CookiePolicy from './pages/CookiePolicy';
import LegalNotice from './pages/LegalNotice';
import Notifications from './pages/Notifications';
import FAQDetail from './pages/FAQDetail';
import AdminFAQ from './pages/AdminFAQ';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import AdminTickets from './pages/AdminTickets';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import CRM from './pages/CRM';
import Invoices from './pages/Invoices';
import Jobs from './pages/Jobs';
import PayInvoice from './pages/PayInvoice';
import Autonomo from './pages/Autonomo';
import Categoria from './pages/Categoria';
import PaymentSuccess from './pages/PaymentSuccess';
import DashboardProInfo from './pages/DashboardProInfo';
import ClientDetail from './pages/ClientDetail';
import CRMAutomations from './pages/CRMAutomations';
import Calendar from './pages/Calendar';
import RequestQuote from './pages/RequestQuote';
import QuoteRequests from './pages/QuoteRequests';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Search": Search,
    "ProfessionalProfile": ProfessionalProfile,
    "Messages": Messages,
    "Favorites": Favorites,
    "MyProfile": MyProfile,
    "AdminDashboard": AdminDashboard,
    "Onboarding": Onboarding,
    "PricingPlans": PricingPlans,
    "ProfileOnboarding": ProfileOnboarding,
    "SubscriptionManagement": SubscriptionManagement,
    "UserTypeSelection": UserTypeSelection,
    "ClientOnboarding": ClientOnboarding,
    "HelpCenter": HelpCenter,
    "FAQ": FAQ,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsConditions": TermsConditions,
    "CookiePolicy": CookiePolicy,
    "LegalNotice": LegalNotice,
    "Notifications": Notifications,
    "FAQDetail": FAQDetail,
    "AdminFAQ": AdminFAQ,
    "Tickets": Tickets,
    "TicketDetail": TicketDetail,
    "AdminTickets": AdminTickets,
    "ProfessionalDashboard": ProfessionalDashboard,
    "CRM": CRM,
    "Invoices": Invoices,
    "Jobs": Jobs,
    "PayInvoice": PayInvoice,
    "Autonomo": Autonomo,
    "Categoria": Categoria,
    "PaymentSuccess": PaymentSuccess,
    "DashboardProInfo": DashboardProInfo,
    "ClientDetail": ClientDetail,
    "CRMAutomations": CRMAutomations,
    "Calendar": Calendar,
    "RequestQuote": RequestQuote,
    "QuoteRequests": QuoteRequests,
}

export const pagesConfig = {
    mainPage: "Search",
    Pages: PAGES,
    Layout: __Layout,
};