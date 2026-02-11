/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";
import { useAlert } from "../hooks/useAlert";
import { useProposals } from "../hooks/useProposals";

export const CreateProposal = ({ changeTab }: {changeTab: (tabName: string) => void}) => {
    const { signer, governorContract } = useWeb3();
    const { reload } = useProposals();
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
            const amount = formData.investAmount ? (ethers.parseEther(formData.investAmount)).toString() : '0';

            const tx = await governorContract!.connect(signer).propose(
                proposeType,
                formData.targetAddress,
                amount,
                formData.description
            );

            showAlert('Proposal creation transaction sent...', 'info');
            await tx.wait();
            showAlert('Proposal created successfully!', 'success');

            setFormData({ proposeType: '', targetAddress: '', investAmount: '', description: '' });
            changeTab("proposals");
        } catch (error: any) {
            console.dir(error);
            
            console.error('Error creating proposal:', error);
            showAlert(error.reason, 'error');
        } finally {
            reload();
            setLoading(false);
        }
    };

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
                            placeholder="1"
                            step="1"
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