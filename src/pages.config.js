import Search from './pages/Search';
import ProfessionalProfile from './pages/ProfessionalProfile';
import Layout from './Layout.jsx';


export const PAGES = {
    "Search": Search,
    "ProfessionalProfile": ProfessionalProfile,
}

export const pagesConfig = {
    mainPage: "Search",
    Pages: PAGES,
    Layout: Layout,
};