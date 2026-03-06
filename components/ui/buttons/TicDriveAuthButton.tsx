import useTicDriveNavigation from '@/hooks/navigation/useTicDriveNavigation';
import {removeSecureToken} from '@/services/auth/secureStore/setToken';
import navigationPush from '@/services/navigation/push';
import navigationReplace from '@/services/navigation/replace';
import {useAppDispatch} from '@/stateManagement/redux/hooks';
import {logout} from '@/stateManagement/redux/slices/authSlice';
import {setServices} from '@/stateManagement/redux/slices/bookingSlice';
import AuthAction from '@/types/auth/Action';
import {Entypo} from '@expo/vector-icons';
import React, {useState} from 'react';
import {Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';

interface TicDriveAuthButtonProps {
  onPress?: () => void;
  action: AuthAction;
}

export const handleLogout = async (
  dispatch: ReturnType<typeof useAppDispatch>,
  navigation: any,
) => {
  await removeSecureToken();
  navigationReplace(navigation, 'Hub');
  dispatch(logout());
  dispatch(setServices([]));
};

const TicDriveAuthButton: React.FC<TicDriveAuthButtonProps> = ({
  onPress,
  action,
}) => {
  const dispatch = useAppDispatch();
  const navigation = useTicDriveNavigation();
  const [loading, setLoading] = useState(false);

  // const handleLogout = async () => {
  //   await removeSecureToken();
  //   navigationReplace(navigation, 'Hub');
  //   dispatch(logout());
  //   dispatch(reset());
  // };

  const handleOnPress = () => {
    setLoading(true);
    onPress && onPress();
    if (action === 'logout') {
      handleLogout(dispatch, navigation);
    }
    if (action === 'login') {
      navigationPush(navigation, 'UserAuthenticationScreen', {
        isUser: true,
      });
    }
  };

  return loading && action === 'logout' ? (
    <View className="p-2.5">
      <Text className="text-lg text-center text-tic">Goodbye!</Text>
    </View>
  ) : (
    <TouchableOpacity
      onPress={handleOnPress}
      className={`p-2.5 rounded-2xl ${action === 'login' ? 'bg-green-500' : 'bg-slate-500'}`}
    >
      <View className="flex-row gap-1 items-center justify-center">
        <Entypo name="login" size={24} color="white" />
        <Text className="text-xl text-white">
          {action[0].toUpperCase() + action.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default TicDriveAuthButton;
