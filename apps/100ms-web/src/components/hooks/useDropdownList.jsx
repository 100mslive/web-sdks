import { useEffect } from "react";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export const useDropdownList = ({ name, open }) => {
  const [dropdownList, setDropdownList] = useSetAppDataByKey(
    APP_DATA.dropdownList
  );

  useEffect(() => {
    if (open) {
      if (!(name in dropdownList)) {
        setDropdownList({ ...dropdownList, [name]: true });
      }
    } else {
      if (name in dropdownList) {
        const newDropdownList = { ...dropdownList };
        delete newDropdownList[name];
        setDropdownList(newDropdownList);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name]);
};
