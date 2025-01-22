import {ClerkProvider, useAuth} from '@clerk/clerk-expo';
import {Slot, useRouter, useSegments} from 'expo-router';
import {useEffect} from 'react';
import {tokenCache} from "@/cache";

const CLERK_PUBLISHABLE_KEY = 'pk_test_Y29uY2lzZS1kb2xwaGluLTQzLmNsZXJrLmFjY291bnRzLmRldiQ';

const InitialLayout = () => {
    const {isLoaded, isSignedIn} = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {

        const inTabsGroup = segments[0] === '(auth)';

        console.log('isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
        if (isSignedIn === undefined) return;

        if (isSignedIn && !inTabsGroup) {
            router.replace('/home');
        } else if (!isSignedIn) {
            router.replace('/login');
        }
    }, [isLoaded, isSignedIn]);

    return <Slot/>;
};


const RootLayout = () => {
    return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
            <InitialLayout/>
        </ClerkProvider>
    );
};

export default RootLayout;