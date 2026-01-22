import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { AlertContainer } from "./components/Alert";
import { TabNav } from "./components/TabNav";
import { Dashboard } from "./components/Dashboard";
import { Proposals } from "./components/Proposals";
import { CreateProposal } from "./components/CreateProposal";
import { Voting } from "./components/Voting";
import { Tokens } from "./components/Token";

export const App = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        console.log(activeTab);
    }, [activeTab]);

    return (
        <>
            <Header />

            <div className="container">
                <AlertContainer />
                <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
                
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'proposals' && <Proposals isActive={activeTab === 'proposals'} />}
                {activeTab === 'create' && <CreateProposal isActive={activeTab === 'create'} />}
                {activeTab === 'voting' && <Voting isActive={activeTab === 'voting'} />}
                {activeTab === 'tokens' && <Tokens isActive={activeTab === 'tokens'} />}
            </div>
        </>
    );
};