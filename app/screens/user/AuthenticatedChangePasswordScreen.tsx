import SafeAreaViewLayout from '@/app/layouts/SafeAreaViewLayout';
import TicDriveNavbar from '@/components/navigation/TicDriveNavbar';
import TicDriveButton from '@/components/ui/buttons/TicDriveButton';
import TicDriveInput from '@/components/ui/inputs/TicDriveInput';
import TicDriveSpinner from '@/components/ui/spinners/TicDriveSpinner';
import VisibilityOffIcon from '@/assets/svg/access/visibility_off.svg';
import VisibilityOnIcon from '@/assets/svg/access/visibility_on.svg';
import TicDriveModal from '@/components/ui/modals/TicDriveModal';
import axiosClient from '@/services/http/axiosClient';
import useGlobalErrors from '@/hooks/errors/useGlobalErrors';
import useTicDriveNavigation from '@/hooks/navigation/useTicDriveNavigation';
import {useTranslation} from 'react-i18next';
import {useState, useMemo} from 'react';
import {View, Text} from 'react-native';
import changePasswordAsync from '@/services/http/requests/post/auth/changePasswordAsync';
import isAcceptablePassword from '@/utils/auth/isAcceptablePassword';

const AuthenticatedChangePasswordScreen = () => {
  const {t} = useTranslation();
  const {setErrorMessage} = useGlobalErrors();
  const navigation = useTicDriveNavigation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const buttonDisabled = useMemo(() => {
    return (
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      newPassword !== confirmPassword ||
      !isAcceptablePassword(newPassword)
    );
  }, [currentPassword, newPassword, confirmPassword]);

  const onSubmit = async () => {
    try {
      setLoading(true);
      await changePasswordAsync(currentPassword, newPassword, confirmPassword);

      setLoading(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      setLoading(false);
      if (error?.status === 400 || error?.status === 401) {
        setErrorMessage(error.message?.errors[0] || t('errors.badRequest'));
      } else {
        setErrorMessage(t('errors.generic'));
      }
    }
  };

  const onSuccess = () => {
    setShowSuccessModal(false);
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaViewLayout>
      <TicDriveNavbar />
      {loading ? (
        <TicDriveSpinner />
      ) : (
        <View style={{flex: 1, justifyContent: 'space-between'}}>
          <View>
            <View className="mx-6 mt-10">
              <Text className="text-xl font-medium">
                {t('changePassword.title', 'Change Password')}
              </Text>
              <Text className="text-base font-medium text-tic mr-4 mb-4 mt-1">
                {t(
                  'changePassword.descriptionforAuthchnagepassword',
                  'For your account security, use a strong new password.',
                )}
              </Text>
            </View>

            <View className="mx-3">
              <TicDriveInput
                existsRightIcon
                placeholder={t('changePassword.currentPassword')}
                customValue={currentPassword}
                onChange={setCurrentPassword}
                isPassword={!isPasswordVisible}
                rightIcon={
                  isPasswordVisible ? (
                    <View className="mt-1">
                      <VisibilityOffIcon />
                    </View>
                  ) : (
                    <VisibilityOnIcon />
                  )
                }
                onRightIcon={() => setIsPasswordVisible(prev => !prev)}
                inputContainerStyle={{marginTop: 10}}
              />
              <TicDriveInput
                existsRightIcon
                placeholder={t('changePassword.newPassword')}
                customValue={newPassword}
                onChange={setNewPassword}
                isPassword={!isPasswordVisible}
                rightIcon={
                  isPasswordVisible ? (
                    <View className="mt-1">
                      <VisibilityOffIcon />
                    </View>
                  ) : (
                    <VisibilityOnIcon />
                  )
                }
                onRightIcon={() => setIsPasswordVisible(prev => !prev)}
                inputContainerStyle={{marginTop: 10}}
              />
              {newPassword.length > 0 && !isAcceptablePassword(newPassword) && (
                <Text className="text-red-600 font-bold text-sm bg-red-100 px-3 py-1 mx-2  mb-2.5 rounded">
                  {t('changePassword.passwordValidationMessage')}
                </Text>
              )}
              <TicDriveInput
                existsRightIcon
                placeholder={t('changePassword.confirmPassword')}
                customValue={confirmPassword}
                onChange={setConfirmPassword}
                isPassword={!isPasswordVisible}
                rightIcon={
                  isPasswordVisible ? (
                    <View className="mt-1">
                      <VisibilityOffIcon />
                    </View>
                  ) : (
                    <VisibilityOnIcon />
                  )
                }
                onRightIcon={() => setIsPasswordVisible(prev => !prev)}
                inputContainerStyle={{marginTop: 10}}
              />
              {confirmPassword.length > 0 &&
                newPassword !== confirmPassword && (
                  <Text className="text-red-600 font-bold text-sm bg-red-100 px-3 py-1 mx-2  mb-2 rounded">
                    {t('changePassword.passwordsDoNotMatch')}
                  </Text>
                )}
            </View>
          </View>

          <View className="mx-3 mb-6">
            <TicDriveButton
              disabled={buttonDisabled}
              text={t('changePassword.updatePassword')}
              customDisabledStyle={{backgroundColor: '#B0E0C3'}}
              customButtonStyle={{height: 56, borderRadius: 12}}
              customTitleStyle={{fontWeight: 700}}
              onClick={onSubmit}
            />
          </View>
        </View>
      )}

      <TicDriveModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t('successPasswordChange.successTitle')}
        content={t('successPasswordChange.subtitle')}
        confirmText={t('common.ok')}
        onConfirm={onSuccess}
        confirmButtonStyle={{backgroundColor: '#4CAF50'}}
      />
    </SafeAreaViewLayout>
  );
};

export default AuthenticatedChangePasswordScreen;
