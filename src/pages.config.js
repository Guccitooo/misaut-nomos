import Search from './pages/Search';
import ProfessionalProfile from './pages/ProfessionalProfile';
import Messages from './pages/Messages';
import Favorites from './pages/Favorites';
import MyProfile from './pages/MyProfile';
import Layout from './Layout.jsx';


export const PAGES = {
    "Search": Search,
    "ProfessionalProfile": ProfessionalProfile,
    "Messages": Messages,
    "Favorites": Favorites,
    "MyProfile": MyProfile,
}

export const pagesConfig = {
    mainPage: "Search",
    Pages: PAGES,
    Layout: Layout,
};