import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaSave } from 'react-icons/fa';
import './UserProfile.css'; // We'll need to create this or use inline styles for now

const UserProfile = () => {
    const user = auth.currentUser;
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const reauthenticate = async (password) => {
        const credential = EmailAuthProvider.credential(user.email, password);
        try {
            await reauthenticateWithCredential(user, credential);
            return true;
        } catch (error) {
            console.error("Re-authentication failed:", error);
            toast.error("Incorrect current password.");
            return false;
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) return;

        setLoading(true);
        try {
            await updateProfile(user, { displayName });
            // Also update in Firestore if needed (optional based on your data model)
            toast.success("Name updated successfully!");
        } catch (error) {
            console.error("Error updating name:", error);
            toast.error("Failed to update name: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!email.trim() || !currentPassword) {
            toast.warning("Please enter new email and current password.");
            return;
        }

        setLoading(true);
        const isAuthenticated = await reauthenticate(currentPassword);
        if (isAuthenticated) {
            try {
                await updateEmail(user, email);
                toast.success("Email updated successfully!");
                setCurrentPassword(''); // Clear password field
            } catch (error) {
                console.error("Error updating email:", error);
                toast.error("Failed to update email: " + error.message);
            }
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !currentPassword) {
            toast.warning("Please enter new password and current password.");
            return;
        }

        setLoading(true);
        const isAuthenticated = await reauthenticate(currentPassword);
        if (isAuthenticated) {
            try {
                await updatePassword(user, newPassword);
                toast.success("Password updated successfully!");
                setNewPassword('');
                setCurrentPassword('');
            } catch (error) {
                console.error("Error updating password:", error);
                toast.error("Failed to update password: " + error.message);
            }
        }
        setLoading(false);
    };

    return (
        <div className="profile-container">
            <h1 className="profile-title">User Profile</h1>

            {/* Update Name */}
            <section className="profile-section">
                <h3><FaUser /> Personal Info</h3>
                <form onSubmit={handleUpdateName} className="profile-form-row">
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display Name"
                        className="profile-input flex-grow"
                    />
                    <button type="submit" disabled={loading} className="profile-btn">
                        <FaSave /> Save
                    </button>
                </form>
            </section>

            <hr className="profile-divider" />

            {/* Update Email */}
            <section className="profile-section">
                <h3><FaEnvelope /> Change Email</h3>
                <form onSubmit={handleUpdateEmail} className="profile-form-col">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="New Email Address"
                        className="profile-input"
                    />
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current Password (Required)"
                        className="profile-input"
                    />
                    <button type="submit" disabled={loading} className="profile-btn">
                        Update Email
                    </button>
                </form>
            </section>

            <hr className="profile-divider" />

            {/* Update Password */}
            <section className="profile-section">
                <h3><FaLock /> Change Password</h3>
                <form onSubmit={handleUpdatePassword} className="profile-form-col">
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className="profile-input"
                    />
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current Password (Required)"
                        className="profile-input"
                    />
                    <button type="submit" disabled={loading} className="profile-btn">
                        Update Password
                    </button>
                </form>
            </section>
        </div>
    );
};

export default UserProfile;
