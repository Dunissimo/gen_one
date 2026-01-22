import { useEffect, useState } from "react";
import { useAlert } from "../contexts/AlertContext";
import { useWeb3 } from "../contexts/Web3Context";
import { formatNumber } from "../utils";

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
                    const rtkAmount = (amount * 1e12).toString();
                    const priceWei = await rtkTokenContract.getPriceInETH(rtkAmount);
                    setRtkPrice(formatNumber(priceWei / 1e18, 4));
                } else {
                    setRtkPrice('0');
                }
            } catch (error) {
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
            const amount = parseFloat(buyAmount);
            const rtkAmount = (amount * 1e12).toString();
            const priceWei = await rtkTokenContract.getPriceInETH(rtkAmount);

            const tx = await rtkTokenContract.connect(signer).purchaseTokens(rtkAmount, { value: priceWei });

            showAlert('Purchase transaction sent...', 'info');
            await tx.wait();
            showAlert('RTK tokens purchased successfully!', 'success');

            setBuyAmount('');
        } catch (error: any) {
            console.error('Error buying RTK:', error);
            showAlert(error.message, 'error');
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