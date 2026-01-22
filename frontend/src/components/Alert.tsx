import { useAlert } from "../contexts/AlertContext";

export const Alert = ({ message, type }: { message: string, type: string }) => (
    <div className={`alert alert-${type}`}>
        <button className="close-btn" onClick={(e: any) => e.target.parentElement.remove()}>×</button>
        {message}
    </div>
);

export const AlertContainer = () => {
    const { alerts } = useAlert();
    
    return (
        <div id="alertContainer">
            {alerts.map((alert: any) => (
                <Alert key={alert.id} message={alert.message} type={alert.type} />
            ))}
        </div>
    );
};

