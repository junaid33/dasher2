
import React, { useState } from 'react';
import { getFieldTypeFromViewsIndex, getClientField } from "@/views/registry";

interface ClientFieldWrapperProps {
  field: any;
  rawValue: any;
  kind: 'create' | 'update';
}

const ClientFieldWrapper: React.FC<ClientFieldWrapperProps> = ({
  field,
  rawValue,
  kind,
}) => {
  const fieldType = getFieldTypeFromViewsIndex(field.viewsIndex);
  const fieldImpl = getClientField(fieldType);
  const FieldComponent = fieldImpl?.Field;
  

  return (
    
      
      <FieldComponent
        field={field}
        rawValue={rawValue}
        kind={kind}
      />
   
  );
};

export default ClientFieldWrapper; 