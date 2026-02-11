import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { AlertContainer } from "./components/Alert";
import { TabNav } from "./components/TabNav";
import { Dashboard } from "./components/Dashboard";
import { Proposals } from "./components/Proposals";
import { CreateProposal } from "./components/CreateProposal";
import { Voting } from "./components/Voting";
import { Tokens } from "./components/Token";

const getTab = () => new URLSearchParams(window.location.search).get('tab') || 'dashboard';

export const App = () => {
    const [activeTab, setActiveTab] = useState(getTab());
    const s = new URLSearchParams(window.location.search).get('tab');
    
    useEffect(() => {
        const handlePopState = () => setActiveTab(getTab());
        
        window.addEventListener('popstate', handlePopState);
        
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    
    const handleTabChange = (tabName: string) => {
        const url = new URL(window.location.href);
        
        url.searchParams.set('tab', tabName);

        window.history.pushState({}, '', url);
        
        setActiveTab(tabName);
    };

    return (
        <>
            <Header />

            <div className="container">
                <AlertContainer />
                <TabNav activeTab={activeTab} setActiveTab={handleTabChange} />
                
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'proposals' && <Proposals />}
                {activeTab === 'create' && <CreateProposal changeTab={handleTabChange}/>}
                {activeTab === 'voting' && <Voting />}
                {activeTab === 'tokens' && <Tokens />}
            </div>
        </>
    );
};