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
import PaymentSuccess from './pages/PaymentSuccess';
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
    "PaymentSuccess": PaymentSuccess,
}

export const pagesConfig = {
    mainPage: "Search",
    Pages: PAGES,
    Layout: __Layout,
};