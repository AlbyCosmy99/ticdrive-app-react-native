import * as React from 'react';
import {Text, StyleSheet, View} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import TicDriveInput from '../ui/inputs/TicDriveInput';
import User from '@/types/User';
import {useAppDispatch} from '@/stateManagement/redux/hooks';
import AuthContext from '@/stateManagement/contexts/auth/AuthContext';
import {login, setToken} from '@/stateManagement/redux/slices/authSlice';
import NavigationContext from '@/stateManagement/contexts/nav/NavigationContext';
import navigationPush from '@/services/navigation/push';
import navigationReset from '@/services/navigation/reset';
import navigationReplace from '@/services/navigation/replace';
import register from '@/services/auth/register';
import {setSecureToken} from '@/services/auth/secureStore/setToken';
import VisibilityOffIcon from '@/assets/svg/access/visibility_off.svg';
import VisibilityOnIcon from '@/assets/svg/access/visibility_on.svg';
import useGlobalErrors from '@/hooks/errors/useGlobalErrors';
import useLogin from '@/hooks/auth/useLogin';
import isAcceptablePassword from '@/utils/auth/isAcceptablePassword';
import isEmailValid from '@/utils/auth/isEmailValid';
import {useTranslation} from 'react-i18next';

type FormData = {
  email: string;
  name?: string;
  password: string;
  repeatedPassword?: string;
};

interface UserAuthenticationFormProps {
  isUserRegistering: boolean;
  setOnFormSubmit: (onSubmit: () => void) => void;
  setLoading: (loading: boolean) => void;
}

const UserAuthenticationForm: React.FC<UserAuthenticationFormProps> = ({
  isUserRegistering,
  setOnFormSubmit,
  setLoading,
}) => {
  const {
    control,
    handleSubmit,
    clearErrors,
    watch,
    formState: {errors},
  } = useForm<FormData>();
  const {t} = useTranslation();

  const {loginRouteName, setLoginRouteName, loginRouteParams} =
    React.useContext(AuthContext);
  const {navigation} = React.useContext(NavigationContext);
  const dispatch = useAppDispatch();
  const {setErrorMessage} = useGlobalErrors();
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const {login: onLogin} = useLogin();

  React.useEffect(() => {
    clearErrors();
  }, [isUserRegistering, clearErrors]);

  const onSubmit = async (data: FormData, isUserRegistering: boolean) => {
    const user: User = {
      name: data.name,
      email: data.email,
      category: 'user',
      password: data.password,
      repeatedPassword: data.repeatedPassword,
    };

    if (isUserRegistering) {
      try {
        setLoading(true);
        const res = await register(user);
        setSecureToken(res.token);
        dispatch(login(user));
        dispatch(setToken(res.token));
        navigationReset(navigation, 0, 'ConfirmEmailScreen');
      } catch (err: any) {
        setErrorMessage(
          err.message?.length > 0 ? err.message[0].description : err.message,
        );
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);

        //login
        const res = await onLogin(user);
        if (res) {
          if (res.emailConfirmed) {
            if (loginRouteName) {
              navigationReset(navigation, 0, loginRouteName, loginRouteParams);
              setLoginRouteName('');
            } else if (navigation?.canGoBack()) {
              navigationReplace(navigation, 'Hub');
            } else {
              navigationPush(navigation, 'Hub');
            }
          } else {
            navigationReset(navigation, 0, 'ConfirmEmailScreen');
          }
        }
      } catch (err: any) {
        setErrorMessage(
          err.message?.length > 0 ? err.message[0].description : err.message,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  React.useEffect(() => {
    setOnFormSubmit(() =>
      handleSubmit(data => onSubmit(data, isUserRegistering)),
    );
  }, [isUserRegistering, handleSubmit, setOnFormSubmit]);

  return (
    <View
      className="pb-0"
      style={[
        styles.container,
        isUserRegistering && styles.containerUserRegistering,
      ]}
    >
      {isUserRegistering && (
        <>
          <Controller
            control={control}
            name="name"
            rules={{required: 'Name is required'}}
            render={({field: {onChange, value}}) => (
              <TicDriveInput
                placeholder="Name"
                existsRightIcon
                customValue={value}
                onChange={onChange}
                inputContainerStyle={styles.inputContainerStyle}
                returnKeyType="send"
              />
            )}
          />
          {errors.name && (
            <Text style={styles.error}>{errors.name.message}</Text>
          )}
        </>
      )}

      <Controller
        control={control}
        name="email"
        rules={{
          required: 'Email is required',
          validate: value =>
            isEmailValid(value) || t('changePassword.ValidEmail'),
        }}
        render={({field: {onChange, value}}) => (
          <TicDriveInput
            placeholder="Email"
            existsRightIcon
            customValue={value}
            onChange={onChange}
            inputContainerStyle={styles.inputContainerStyle}
            returnKeyType="send"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        rules={{
          required: 'Password is required',
          validate: value =>
            isAcceptablePassword(value) ||
            t('changePassword.passwordValidationMessage'),
        }}
        render={({field: {onChange, value}}) => (
          <TicDriveInput
            placeholder="Password"
            existsRightIcon
            customValue={value}
            onChange={onChange}
            inputContainerStyle={styles.inputContainerStyle}
            returnKeyType="send"
            isPassword={!isPasswordVisible}
            containerStyle={{height: 65}}
            itHandlesPassword
            rightIcon={
              isPasswordVisible ? (
                <View className="mt-1">
                  <VisibilityOffIcon />
                </View>
              ) : (
                <VisibilityOnIcon />
              )
            }
            onRightIcon={() =>
              setIsPasswordVisible(previousValue => !previousValue)
            }
          />
        )}
      />
      {errors.password && (
        <Text style={styles.error}>{errors.password.message}</Text>
      )}

      {isUserRegistering && (
        <>
          <Controller
            control={control}
            name="repeatedPassword"
            rules={{
              required: 'Repeated password is required',
              validate: value =>
                value === watch('password') || 'Passwords do not match',
            }}
            render={({field: {onChange, value}}) => (
              <TicDriveInput
                containerViewStyleTailwind="mt-4"
                placeholder="Repeat Password"
                existsRightIcon
                customValue={value}
                onChange={onChange}
                inputContainerStyle={styles.inputContainerStyle}
                returnKeyType="send"
                isPassword={!isPasswordVisible}
                containerStyle={{height: 65}}
                rightIcon={
                  isPasswordVisible ? (
                    <View className="mt-1">
                      <VisibilityOffIcon />
                    </View>
                  ) : (
                    <VisibilityOnIcon />
                  )
                }
                onRightIcon={() =>
                  setIsPasswordVisible(previousValue => !previousValue)
                }
              />
            )}
          />
          {errors.repeatedPassword && (
            <Text style={styles.error}>{errors.repeatedPassword.message}</Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  error: {
    color: 'red',
    marginBottom: 30,
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#fdd',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  inputContainerStyle: {
    marginTop: 0,
  },
  containerUserRegistering: {
    paddingBottom: 0,
  },
});

export default UserAuthenticationForm;
