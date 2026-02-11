// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TabNav = ({ activeTab, setActiveTab }: any) => {
    const tabs = ['dashboard', 'proposals', 'create', 'voting', 'tokens'];
    const labels = ['Dashboard', 'Proposals', 'Create Proposal', 'Vote', 'Tokens'];

    return (
        <div className="tabs">
            {tabs.map((tab, idx) => (
                <button
                    key={tab}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                >
                    {labels[idx]}
                </button>
            ))}
        </div>
    );
};