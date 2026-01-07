// src/components/UpdateNotification.jsx
import React, { useState, useEffect } from 'react';
import { versionManager } from '../services/versionManager';

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.log('[UpdateNotification] 🎯 Component MOUNTED');
    
    // Listen for update events
    function handleUpdate(event) {
      console.log('[UpdateNotification] 📨 Event received!');
      const data = event.detail;
      
      if (data && data.latestVersion) {
        console.log('[UpdateNotification] ✅ Setting update info:', data);
        setUpdateInfo(data);
      }
    }

    window.addEventListener('update-available', handleUpdate);
    console.log('[UpdateNotification] ✅ Listener attached');

    // IMPORTANT: Actively check on mount (don't wait for event)
    console.log('[UpdateNotification] 🔍 Checking for updates on mount...');
    
    // Give main.jsx a moment to initialize, then check
    setTimeout(async () => {
      try {
        const hasUpdate = await versionManager.checkForUpdates();
        console.log('[UpdateNotification] Initial check result:', hasUpdate);
        
        if (hasUpdate) {
          // Set update info directly
          setUpdateInfo({
            currentVersion: versionManager.getCurrentVersion(),
            latestVersion: versionManager.getLatestVersion(),
            releaseNotes: [] // Will be filled by event if it fires
          });
        }
      } catch (error) {
        console.error('[UpdateNotification] Initial check error:', error);
      }
    }, 1000);

    // Also poll every 30 seconds as backup
    const pollInterval = setInterval(async () => {
      console.log('[UpdateNotification] 🔄 Polling for updates...');
      
      const hasUpdate = await versionManager.checkForUpdates();
      
      if (hasUpdate && !updateInfo) {
        console.log('[UpdateNotification] Poll found update!');
        setUpdateInfo({
          currentVersion: versionManager.getCurrentVersion(),
          latestVersion: versionManager.getLatestVersion(),
          releaseNotes: []
        });
      }
    }, 30000);

    return () => {
      console.log('[UpdateNotification] 🔴 Component unmounting');
      window.removeEventListener('update-available', handleUpdate);
      clearInterval(pollInterval);
    };
  }, []); // Empty deps - run once on mount

  // Update info when event provides full details
  useEffect(() => {
    if (updateInfo) {
      console.log('[UpdateNotification] 📊 Update info state:', updateInfo);
    }
  }, [updateInfo]);

  function applyUpdate() {
    console.log('[UpdateNotification] 🚀 Applying update...');
    versionManager.applyUpdate();
  }

  function dismissUpdate() {
    console.log('[UpdateNotification] ❌ Dismissed');
    setUpdateInfo(null);
  }

  if (!updateInfo) {
    return null;
  }

  console.log('[UpdateNotification] 🎨 RENDERING NOTIFICATION!');

  return (
    <>
      {/* Compact notification */}
      {!showDetails && (
        <div 
          id="update-notification"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 10001,
            minWidth: '320px',
            animation: 'slideInRight 0.5s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '32px' }}>🎉</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                Update Available!
              </div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                Version {updateInfo.latestVersion} is ready
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={applyUpdate}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              ↻ Update Now
            </button>
            
            <button
              onClick={() => setShowDetails(true)}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Details
            </button>
            
            <button
              onClick={dismissUpdate}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Detailed modal */}
      {showDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10002,
          padding: '20px'
        }}
        onClick={() => setShowDetails(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                Update Available
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Version {updateInfo.currentVersion} → {updateInfo.latestVersion}
              </p>
            </div>

            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '12px' }}>
                  What's New:
                </h3>
                <ul style={{
                  margin: 0,
                  padding: '0 0 0 20px',
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.8'
                }}>
                  {updateInfo.releaseNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              background: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#666'
            }}>
              💡 The app will reload automatically after updating
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={applyUpdate}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ↻ Update Now
              </button>
              
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  padding: '14px 24px',
                  background: '#e9ecef',
                  color: '#495057',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}