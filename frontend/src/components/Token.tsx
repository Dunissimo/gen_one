/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";
import { useAlert } from "../hooks/useAlert";

export const Tokens = ({ isActive }: { isActive: boolean }) => {
    const { rtkTokenContract, signer } = useWeb3();
    const { showAlert } = useAlert();
    const [buyAmount, setBuyAmount] = useState('');
    const [rtkPrice, setRtkPrice] = useState('Calculating...');
    const [buying, setBuying] = useState(false);

    useEffect(() => {
        const calculatePrice = async () => {
            try {
                const amount = parseFloat(buyAmount);

                if (amount > 0) {
                    const rtkAmount = amount.toString();
                    const priceWei = await rtkTokenContract!.getPriceInETH(rtkAmount);

                    setRtkPrice(ethers.formatUnits(priceWei, 18));
                } else {
                    setRtkPrice('0');
                }
            } catch (error) {
                console.error(error);
                setRtkPrice('Error');
            }
        };

        calculatePrice();
    }, [buyAmount, rtkTokenContract]);

    const handleBuyRtk = async (e: any) => {
        e.preventDefault();
        if (!signer) {
            showAlert('Please connect wallet first', 'error');
            return;
        }

        try {
            setBuying(true);
            const rtkAmount = buyAmount;
            const priceWei = await rtkTokenContract!.getPriceInETH(rtkAmount);

            const tx = await rtkTokenContract!.connect(signer).purchaseTokens(rtkAmount, { value: priceWei });

            showAlert('Purchase transaction sent...', 'info');
            await tx.wait();
            showAlert('RTK tokens purchased successfully!', 'success');

            setBuyAmount('');
        } catch (error: any) {
            console.error('Error buying RTK:', error);
            showAlert(error.reason, 'error');
        } finally {
            setBuying(false);
        }
    };

    if (!isActive) return null;

    return (
        <div id="tokens" className="tab-content">
            <div className="card">
                <h2>💰 Buy RTK Tokens</h2>
                <form onSubmit={handleBuyRtk}>
                    <div className="form-group">
                        <label>RTK Amount to Purchase *</label>
                        <input
                            type="number"
                            placeholder="100"
                            step="0.01"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ background: 'var(--light)', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                        <strong>Price:</strong> <span>{rtkPrice}</span> ETH
                    </div>
                    <button type="submit" disabled={buying}>
                        {buying ? <><span className="loading"></span> Purchasing...</> : 'Purchase RTK Tokens'}
                    </button>
                </form>
            </div>
        </div>
    );
};