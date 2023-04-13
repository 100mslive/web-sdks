import { useEffect } from "react";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export const useDropdownList = ({ name, open }) => {
  const [, setDropdownList] = useSetAppDataByKey(APP_DATA.dropdownList);

  useEffect(() => {
    if (open) {
      setDropdownList(list => {
        return list.includes(name) ? list : list.concat(name);
      });
    } else {
      setDropdownList(list => {
        const index = list.indexOf(name);
        return index >= 0 ? [...list].splice(index, 1) : list;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name]);
};
