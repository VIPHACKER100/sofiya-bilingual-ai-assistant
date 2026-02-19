/**
 * SOFIYA AR Interface
 * Phase 19.2: Augmented Reality Overlay
 * 
 * Overlays digital information on physical world using ARKit/ARCore.
 * Supports translations, notifications, device controls, and navigation.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function ARInterface({ enabled = false, features = {} }) {
    const containerRef = useRef(null);
    const [arSession, setARSession] = useState(null);
    const [overlays, setOverlays] = useState([]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        initializeAR();

        return () => {
            if (arSession) {
                arSession.destroy();
            }
        };
    }, [enabled]);

    /**
     * Initializes AR session
     */
    const initializeAR = async () => {
        try {
            // Check AR support
            if (!navigator.xr) {
                console.warn('[ARInterface] WebXR not supported');
                return;
            }

            // Request AR session
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local', 'hit-test'],
                optionalFeatures: ['dom-overlay']
            });

            setARSession(session);

            // Initialize Three.js scene
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            containerRef.current?.appendChild(renderer.domElement);

            // Start AR rendering loop
            session.requestAnimationFrame((time, frame) => {
                renderAR(scene, camera, renderer, frame);
            });

            console.log('[ARInterface] AR session initialized');
        } catch (error) {
            console.error('[ARInterface] Failed to initialize AR:', error);
        }
    };

    /**
     * Renders AR frame
     */
    const renderAR = (scene, camera, renderer, frame) => {
        // Update camera pose from AR frame
        const pose = frame.getViewerPose(arSession);
        if (pose) {
            camera.matrix.fromArray(pose.transform.matrix);
            camera.updateMatrixWorld(true);
        }

        // Render scene
        renderer.render(scene, camera);

        // Request next frame
        arSession.requestAnimationFrame((time, frame) => {
            renderAR(scene, camera, renderer, frame);
        });
    };

    /**
     * Adds translation overlay
     */
    const addTranslationOverlay = (text, position, targetLanguage) => {
        const overlay = {
            id: `translation_${Date.now()}`,
            type: 'translation',
            text,
            translatedText: translateText(text, targetLanguage),
            position,
            visible: true
        };

        setOverlays(prev => [...prev, overlay]);
        return overlay.id;
    };

    /**
     * Adds notification overlay
     */
    const addNotificationOverlay = (message, position, duration = 5000) => {
        const overlay = {
            id: `notification_${Date.now()}`,
            type: 'notification',
            message,
            position,
            visible: true,
            duration
        };

        setOverlays(prev => [...prev, overlay]);

        // Auto-remove after duration
        setTimeout(() => {
            removeOverlay(overlay.id);
        }, duration);

        return overlay.id;
    };

    /**
     * Adds device control overlay
     */
    const addDeviceControlOverlay = (device, position) => {
        const overlay = {
            id: `device_${device.id}`,
            type: 'device_control',
            device,
            position,
            visible: true
        };

        setOverlays(prev => [...prev, overlay]);
        return overlay.id;
    };

    /**
     * Adds navigation overlay
     */
    const addNavigationOverlay = (destination, position) => {
        const overlay = {
            id: `nav_${Date.now()}`,
            type: 'navigation',
            destination,
            position,
            visible: true,
            arrows: [] // Arrow markers for path
        };

        setOverlays(prev => [...prev, overlay]);
        return overlay.id;
    };

    /**
     * Removes overlay
     */
    const removeOverlay = (overlayId) => {
        setOverlays(prev => prev.filter(o => o.id !== overlayId));
    };

    /**
     * Translates text (placeholder)
     */
    const translateText = (text, targetLanguage) => {
        // In production, call translation API
        return `[${targetLanguage}] ${text}`;
    };

    if (!enabled) {
        return null;
    }

    return (
        <div ref={containerRef} className="ar-interface" style={{ width: '100%', height: '100%' }}>
            {/* AR camera view */}
            <video
                id="ar-video"
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            
            {/* Overlays rendered on top */}
            {overlays.map(overlay => (
                <AROverlay key={overlay.id} overlay={overlay} />
            ))}
        </div>
    );
}

/**
 * AR Overlay Component
 */
function AROverlay({ overlay }) {
    const [position, setPosition] = useState(overlay.position || { x: 0, y: 0, z: 0 });

    useEffect(() => {
        // Update position based on AR tracking
        // In production, use AR hit-test to anchor overlay to real-world position
    }, []);

    const renderContent = () => {
        switch (overlay.type) {
            case 'translation':
                return (
                    <div className="ar-translation-overlay">
                        <div className="original-text">{overlay.text}</div>
                        <div className="translated-text">{overlay.translatedText}</div>
                    </div>
                );

            case 'notification':
                return (
                    <div className="ar-notification-overlay">
                        <div className="notification-message">{overlay.message}</div>
                    </div>
                );

            case 'device_control':
                return (
                    <div className="ar-device-control-overlay">
                        <div className="device-name">{overlay.device.name}</div>
                        <button onClick={() => toggleDevice(overlay.device.id)}>
                            {overlay.device.state === 'on' ? 'Turn Off' : 'Turn On'}
                        </button>
                    </div>
                );

            case 'navigation':
                return (
                    <div className="ar-navigation-overlay">
                        <div className="destination">{overlay.destination}</div>
                        <div className="arrow">→</div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className="ar-overlay"
            style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: `translateZ(${position.z}px)`
            }}
        >
            {renderContent()}
        </div>
    );
}

/**
 * Toggles device (placeholder)
 */
function toggleDevice(deviceId) {
    console.log(`[ARInterface] Toggling device: ${deviceId}`);
    // In production, call device control API
}

export default ARInterface;
