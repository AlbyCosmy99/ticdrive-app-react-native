import {View} from 'react-native';
import {useContext, useEffect} from 'react';
import {
  login,
  logout,
  setToken,
} from '@/stateManagement/redux/slices/authSlice';
import {useAppDispatch, useAppSelector} from '@/stateManagement/redux/hooks';
import * as SplashScreen from 'expo-splash-screen';
import {useNavigation} from '@react-navigation/native';
import NavigationContext from '@/stateManagement/contexts/nav/NavigationContext';
import navigationReset from '@/services/navigation/reset';
import {getToken} from '@/services/auth/secureStore/getToken';
import {removeSecureToken} from '@/services/auth/secureStore/setToken';
import i18n from '@/i18n';
import TicDriveSpinner from '@/components/ui/spinners/TicDriveSpinner';
import getUserData from '@/services/http/requests/auth/getUserData';
import formatUserData from '@/utils/auth/formatUserData';

let hasHiddenSplashScreen = false;

const Hub = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const {setNavigation} = useContext(NavigationContext);

  const languageCode = useAppSelector(state => state.language.languageCode);

  useEffect(() => {
    setNavigation(navigation);
    const checkAuth = async () => {
      try {
        const token = await getToken();
        //@ts-ignore
        if (token) {
          dispatch(setToken(token));
          try {
            const userData = await getUserData(token);
            dispatch(login(formatUserData(userData)));
            if (userData.emailConfirmed) {
              navigationReset(
                navigation,
                0,
                'userTabs',
                {animation: 'fade'},
                'Home',
              );
            } else {
              navigationReset(navigation, 0, 'ConfirmEmailScreen', {
                animation: 'fade',
              });
            }
          } catch (err) {
            console.error(err);
            console.log(err);
            //if here, probably token is in secureStore but user is not registered in db - to solve, we make the user remove token from secureStore and retry
            console.error('error while getting user data.');
            navigationReset(navigation, 0, 'userTabs', {animation: 'fade'});
            await removeSecureToken();
            dispatch(logout());
          }
        } else {
          navigationReset(navigation, 0, 'userTabs', {animation: 'fade'});
        }
      } catch (error) {
        console.error('Error checking auth status: ', error);
      } finally {
        if (!hasHiddenSplashScreen) {
          hasHiddenSplashScreen = true;

          setTimeout(() => {
            SplashScreen.hideAsync().catch(error => {
              console.warn('Unable to hide splash screen:', error);
            });
          }, 200);
        }
      }
    };
    checkAuth();

    i18n.changeLanguage(languageCode);
  }, []);

  useEffect(() => {
    setNavigation(navigation);
  }, [navigation]);

  return (
    <View className="justify-center items-center w-full h-full bg-white">
      <TicDriveSpinner />
    </View>
  );
};

export default Hub;
