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
import Layout from './Layout.jsx';


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
}

export const pagesConfig = {
    mainPage: "Search",
    Pages: PAGES,
    Layout: Layout,
};