import {
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import useTicDriveNavigation from '@/hooks/navigation/useTicDriveNavigation';
import navigationPush from '@/services/navigation/push';
import {useAppDispatch, useAppSelector} from '@/stateManagement/redux/hooks';
import LinearGradientViewLayout from '../layouts/LinearGradientViewLayout';
import SafeAreaViewLayout from '../layouts/SafeAreaViewLayout';
import NotLogged from '@/components/auth/NotLogged';
import TicDriveNavbar from '@/components/navigation/TicDriveNavbar';
import CircularUserAvatar from '@/components/ui/avatars/CircularUserAvatar';
import CrossPlatformButtonLayout from '@/components/ui/buttons/CrossPlatformButtonLayout';
import {handleLogout} from '@/components/ui/buttons/TicDriveAuthButton';
import HorizontalLine from '@/components/ui/HorizontalLine';
import IconTextPair from '@/components/ui/IconTextPair';

import useJwtToken from '@/hooks/auth/useJwtToken';
import isAndroidPlatform from '@/utils/devices/isAndroidPlatform';

import HeartIcon from '@/assets/svg/emotions/EmptyHeart.svg';
import CustomerServiceIcon from '@/assets/svg/headphone.svg';
import Logout from '@/assets/svg/logout.svg';
import AddressIcon from '@/assets/svg/map.svg';
import MailIcon from '@/assets/svg/notifications/mail.svg';
import FAQ from '@/assets/svg/faq.svg';
import Translate from '@/assets/svg/translate.svg';
import VehicleIcon from '@/assets/svg/vehicles/car2.svg';
import ChangepasswordIcon from '@/assets/svg/changepassword.svg';

import EditIcon from '@/assets/svg/writing/change.svg';
import SaveIcon from '@/assets/svg/operations/save.svg';
import DangerIcon from '@/assets/svg/danger.svg';

import TicDriveModal from '@/components/ui/modals/TicDriveModal';
import {setLanguageCode} from '@/stateManagement/redux/slices/languageSlice';
import i18n from '@/i18n';
import {t} from 'i18next';
import User from '@/types/User';
import updateUser from '@/services/http/requests/account/updateUser';
import useGlobalErrors from '@/hooks/errors/useGlobalErrors';
import TicDriveSpinner from '@/components/ui/spinners/TicDriveSpinner';
import {login} from '@/stateManagement/redux/slices/authSlice';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({title, children}) => (
  <View className="my-2">
    <Text className="font-medium text-2xl" allowFontScaling={false}>
      {title}
    </Text>
    {children}
  </View>
);

export default function UserAccount() {
  const DEFAULT_AVATAR =
    'https://ticdrive.blob.core.windows.net/internal/defaultAvatar.png';
  const [isEditing, setIsEditing] = useState(false);
  const [loadingEditingUser, setLoadingEditingUser] = useState(false);

  const user = useAppSelector(state => state.auth.user);
  const [editedUser, setEditedUser] = useState<User>({name: user?.name});

  const [languageOptionsVisible, setLanguageOptionsVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageChangedModal, setShowLanguageChangedModal] =
    useState(false);

  const dispatch = useAppDispatch();
  const languageCode = useAppSelector(state => state.language.languageCode);
  const token = useJwtToken();
  const navigation = useTicDriveNavigation();
  const {setErrorMessage} = useGlobalErrors();

  const onFavoriteWorkshops = () => {
    navigationPush(navigation, 'WorkshopsListScreen', {favorite: true});
  };

  const handleChangeLanguage = (newLanguage: 'en' | 'it') => {
    i18n.changeLanguage(newLanguage);
    dispatch(setLanguageCode(newLanguage));
    setShowLanguageChangedModal(true);
  };

  const handleFAQ = () => navigationPush(navigation, 'FAQScreen');
  const handleDangerZone = () => navigationPush(navigation, 'DangerZoneScreen');
  const handleSupport = () =>
    navigationPush(navigation, 'SupportSectionScreen');

  const handleOnEdit = async () => {
    if (!isEditing) {
      setEditedUser({name: user?.name?.trim() || ''});
      setIsEditing(true);
    } else {
      if (editedUser.name !== user?.name) {
        const rawName = editedUser.name || '';
        const trimmedName = rawName.trim().replace(/\s+/g, ' ');

        try {
          setLoadingEditingUser(true);
          await updateUser({...editedUser, name: trimmedName}, token ?? '');
          dispatch(login({...user, name: trimmedName}));
        } catch (e: any) {
          setErrorMessage(e.message);
        } finally {
          setLoadingEditingUser(false);
          setIsEditing(false);
        }
      } else {
        setIsEditing(false);
      }
    }
  };

  if (!token) {
    return (
      <LinearGradientViewLayout>
        <SafeAreaViewLayout disabled={!isAndroidPlatform()}>
          <TicDriveNavbar />
          <NotLogged />
        </SafeAreaViewLayout>
      </LinearGradientViewLayout>
    );
  }

  return (
    <LinearGradientViewLayout>
      <SafeAreaViewLayout disabled={!isAndroidPlatform()}>
        <TicDriveNavbar canGoBack={false} />
        <View className="mx-2.5">
          {loadingEditingUser ? (
            <View className="h-[88px]">
              <TicDriveSpinner />
            </View>
          ) : (
            <View className="flex-row justify-between items-center h-[88px]">
              <View className="flex-1 flex-row items-center space-x-4 p-2">
                <CircularUserAvatar
                  uri={user?.images?.[0]?.url || DEFAULT_AVATAR}
                  styles={{width: 70, height: 70}}
                />
                <View className="flex-1">
                  {isEditing ? (
                    <TextInput
                      className="font-semibold text-lg border-b border-gray-300"
                      style={{lineHeight: 20}}
                      value={editedUser.name || ''}
                      onChangeText={text =>
                        setEditedUser({...editedUser, name: text})
                      }
                      placeholder={t('userAccount.enterYourName')}
                      placeholderTextColor="#888"
                      autoFocus
                      allowFontScaling={false}
                      accessibilityLabel="Name Input"
                    />
                  ) : user?.name ? (
                    <Text
                      className="font-semibold text-xl text-gray-800"
                      allowFontScaling={false}
                    >
                      {user.name}
                    </Text>
                  ) : (
                    <CrossPlatformButtonLayout onPress={handleOnEdit}>
                      <Text
                        className="font-normal text-lg text-gray-800"
                        allowFontScaling={false}
                      >
                        {t('userAccount.editYourName')}
                      </Text>
                    </CrossPlatformButtonLayout>
                  )}
                </View>
              </View>

              <View className="flex-shrink-0 pr-2">
                <CrossPlatformButtonLayout onPress={handleOnEdit}>
                  <View className="flex-row items-center">
                    {isEditing ? (
                      <SaveIcon width={20} height={20} />
                    ) : (
                      <EditIcon width={20} height={20} />
                    )}
                    <Text
                      className="text-green-600 font-medium ml-1"
                      allowFontScaling={false}
                    >
                      {isEditing ? t('common.save') : t('common.edit')}
                    </Text>
                  </View>
                </CrossPlatformButtonLayout>
              </View>
            </View>
          )}

          <HorizontalLine />

          <ScrollView
            className="px-1"
            contentContainerStyle={{paddingBottom: 140}}
          >
            <Section title={t('userAccount.sectionTitle')}>
              <View className="flex-row items-center py-2">
                <MailIcon />
                <Text
                  className="text-base font-medium pl-1"
                  allowFontScaling={false}
                >
                  {user?.email || t('notAvailable')}
                </Text>
              </View>

              <HorizontalLine />

              <View className="flex-row items-center py-2">
                <AddressIcon />
                <Text
                  className="text-base font-medium pl-1"
                  allowFontScaling={false}
                >
                  {user?.address || t('notAvailable')}
                </Text>
              </View>

              <HorizontalLine />

              <CrossPlatformButtonLayout
                onPress={() => navigationPush(navigation, 'UserVehiclesScreen')}
              >
                <IconTextPair
                  text={t('userAccount.registeredVehicles')}
                  icon={<VehicleIcon />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />
              <CrossPlatformButtonLayout
                onPress={() =>
                  navigationPush(
                    navigation,
                    'AuthenticatedChangePasswordScreen',
                  )
                }
              >
                <IconTextPair
                  text={t('changePassword.title')}
                  icon={<ChangepasswordIcon />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />

              <CrossPlatformButtonLayout onPress={onFavoriteWorkshops}>
                <IconTextPair
                  text={t('userAccount.favoriteWorkshops')}
                  icon={<HeartIcon />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />
            </Section>

            <Section title={t('userAccount.helpAndSupport')}>
              <CrossPlatformButtonLayout
                onPress={() =>
                  setLanguageOptionsVisible(!languageOptionsVisible)
                }
              >
                <IconTextPair
                  text={t('language.changeLanguage')}
                  icon={<Translate />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss={`my-0 pt-1 ${languageOptionsVisible && 'pb-0'}`}
                />
              </CrossPlatformButtonLayout>

              {languageOptionsVisible && (
                <View className="ml-8">
                  <TouchableOpacity
                    className="py-2 pt-3"
                    onPress={() => handleChangeLanguage('it')}
                  >
                    <Text
                      className={`text-base ${languageCode === 'it' ? 'font-bold text-blue-600' : 'text-black'}`}
                      allowFontScaling={false}
                    >
                      🇮🇹 {t('language.italian')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-2"
                    onPress={() => handleChangeLanguage('en')}
                  >
                    <Text
                      className={`text-base ${languageCode === 'en' ? 'font-bold text-blue-600' : 'text-black'}`}
                      allowFontScaling={false}
                    >
                      🇬🇧 {t('language.english')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <HorizontalLine />

              <CrossPlatformButtonLayout onPress={handleFAQ}>
                <IconTextPair
                  text={t('userAccount.faq')}
                  icon={<FAQ />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />

              <CrossPlatformButtonLayout onPress={handleSupport}>
                <IconTextPair
                  text={t('userAccount.customerSupport')}
                  icon={<CustomerServiceIcon />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />

              <CrossPlatformButtonLayout
                onPress={() => setShowLogoutModal(true)}
              >
                <IconTextPair
                  text={t('userAccount.logout')}
                  icon={<Logout />}
                  textTailwindCss="text-base font-medium pl-1"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />

              <CrossPlatformButtonLayout onPress={handleDangerZone}>
                <IconTextPair
                  text={t('userAccount.dangerZone')}
                  icon={<DangerIcon />}
                  textTailwindCss="text-base font-medium pl-1 text-[#fc0600]"
                  containerTailwindCss="py-2 my-0 pt-1"
                />
              </CrossPlatformButtonLayout>

              <HorizontalLine />
            </Section>
          </ScrollView>
        </View>

        {/* Modals */}
        <TicDriveModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false);
            handleLogout(dispatch, navigation);
          }}
          title={t('userAccount.logout')}
          content={t('userAccount.logoutConfirm')}
          confirmText={t('confirm')}
          cancelText={t('common.cancel')}
          confirmButtonStyle={{backgroundColor: '#E53935'}}
        />

        <TicDriveModal
          visible={showLanguageChangedModal}
          onClose={() => setShowLanguageChangedModal(false)}
          title={`${t('language.languageChanged')}!`}
          content={`${t('language.yourNewLanguageIs')}: ${
            languageCode === 'en'
              ? t('language.english')
              : t('language.italian')
          }.`}
          confirmText={t('common.ok')}
          confirmButtonStyle={{
            backgroundColor: '#4CAF50',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 3.5,
          }}
        />
      </SafeAreaViewLayout>
    </LinearGradientViewLayout>
  );
}
