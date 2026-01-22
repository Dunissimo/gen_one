import { useState } from "react";
import { useAlert } from "../contexts/AlertContext";
import { useWeb3 } from "../contexts/Web3Context";

export const CreateProposal = ({ isActive }: { isActive: boolean }) => {
    const { signer, governorContract } = useWeb3();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        proposeType: '',
        targetAddress: '',
        investAmount: '',
        description: ''
    });

    const handleChange = (e: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!signer) {
            showAlert('Please connect wallet first', 'error');
            return;
        }

        try {
            setLoading(true);
            const proposeType = parseInt(formData.proposeType);
            const amount = formData.investAmount ? (parseFloat(formData.investAmount) * 1e18).toString() : '0';

            const tx = await governorContract.connect(signer).propose(
                proposeType,
                formData.targetAddress,
                amount,
                formData.description
            );

            showAlert('Proposal creation transaction sent...', 'info');
            await tx.wait();
            showAlert('Proposal created successfully!', 'success');

            setFormData({ proposeType: '', targetAddress: '', investAmount: '', description: '' });
        } catch (error: any) {
            console.error('Error creating proposal:', error);
            showAlert(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isActive) return null;

    return (
        <div id="create" className="tab-content">
            <div className="card">
                <h2>➕ Create New Proposal</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Proposal Type *</label>
                        <select name="proposeType" value={formData.proposeType} onChange={handleChange} required>
                            <option value="">-- Select Type --</option>
                            <option value="1">Invest in New Startup (Type A)</option>
                            <option value="2">Additional Investment (Type B)</option>
                            <option value="3">Add DAO Member (Type C)</option>
                            <option value="4">Remove DAO Member (Type D)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Target Address *</label>
                        <input
                            type="text"
                            name="targetAddress"
                            placeholder="0x..."
                            value={formData.targetAddress}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Investment Amount (ETH)</label>
                        <input
                            type="number"
                            name="investAmount"
                            placeholder="0.5"
                            step="0.01"
                            min="0"
                            value={formData.investAmount}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            name="description"
                            placeholder="Detailed description of the proposal..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? <><span className="loading"></span> Creating...</> : 'Create Proposal'}
                    </button>
                </form>
            </div>
        </div>
    );
};