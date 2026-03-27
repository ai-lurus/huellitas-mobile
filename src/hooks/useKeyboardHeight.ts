import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent, Platform } from 'react-native';

/** Altura del teclado en px (0 si está cerrado). Sirve para añadir padding al scroll y poder ver los inputs. */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent): void => setHeight(e.endCoordinates.height);
    const onHide = (): void => setHeight(0);

    const subShow = Keyboard.addListener(show, onShow);
    const subHide = Keyboard.addListener(hide, onHide);

    return (): void => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return height;
}
