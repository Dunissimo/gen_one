import { ethers } from 'ethers';
import { governor, profi, proposals, quorum, rtk, vault, voting } from '../../conf.json';

export const CONFIG = {
    FUND_GOVERNOR: governor,
    PROFI_TOKEN: profi,
    RTK_TOKEN: rtk,
    FUND_VAULT: vault,
    PROPOSAL_MANAGER: proposals,
    VOTING_SYSTEM: voting,
    QUORUM_CALCULATOR: quorum,
    RPC_URL: 'http://localhost:8545',
    NETWORK_ID: 31337
};

export const formatAddress = (addr: string) => {
    if (!addr) return '-';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
};

export const formatNumber = (num: number, decimals = 12) => {
    return ethers.parseUnits(String(num), decimals).toString();
};

export const formatString = (str: string) => {
    return Intl.NumberFormat('RU-ru').format(parseFloat(str));
}
